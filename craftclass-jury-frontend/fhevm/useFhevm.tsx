"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Eip1193Provider } from "ethers";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";
import type { FhevmInstance, FhevmStatus } from "./internal/fhevmTypes";

export interface UseFhevmOptions {
  provider?: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  enabled?: boolean;
}

export interface UseFhevmResult {
  instance: FhevmInstance | null;
  status: FhevmStatus;
  error: Error | null;
  isLoading: boolean;
  isReady: boolean;
  refresh: () => void;
}

export function useFhevm(options: UseFhevmOptions = {}): UseFhevmResult {
  const { provider, mockChains, enabled = true } = options;

  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !provider) {
      setStatus("idle");
      setInstance(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let cancelled = false;

    async function init() {
      try {
        setStatus("sdk-loading");
        setError(null);

        const fhevmInstance = await createFhevmInstance({
          provider: provider!,
          mockChains,
          signal: controller.signal,
          onStatusChange: (newStatus) => {
            if (!cancelled) {
              setStatus(newStatus);
            }
          },
        });

        if (!cancelled) {
          setInstance(fhevmInstance);
          setStatus("ready");
        }
      } catch (err) {
        if (err instanceof FhevmAbortError) {
          console.log("[useFhevm] Operation cancelled");
          return;
        }

        console.error("[useFhevm] Error creating instance:", err);
        if (!cancelled) {
          setError(err as Error);
          setStatus("error");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [provider, mockChains, enabled, refreshKey]);

  const isLoading = ["sdk-loading", "sdk-loaded", "sdk-initializing", "sdk-initialized", "creating"].includes(status);
  const isReady = status === "ready" && instance !== null;

  return {
    instance,
    status,
    error,
    isLoading,
    isReady,
    refresh,
  };
}

