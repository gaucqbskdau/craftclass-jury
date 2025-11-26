"use client";

import { useState, useEffect, useCallback } from "react";
import type { EIP6963ProviderDetail } from "./Eip6963Types";

export function useEip6963() {
  const [providers, setProviders] = useState<Map<string, EIP6963ProviderDetail>>(
    new Map()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnnouncement = (event: Event) => {
      const e = event as CustomEvent<EIP6963ProviderDetail>;
      const detail = e.detail;

      setProviders((prev) => {
        const next = new Map(prev);
        next.set(detail.info.uuid, detail);
        return next;
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnouncement);

    // Request providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
    };
  }, []);

  const getProvider = useCallback(
    (rdns: string): EIP6963ProviderDetail | undefined => {
      for (const provider of providers.values()) {
        if (provider.info.rdns === rdns) {
          return provider;
        }
      }
      return undefined;
    },
    [providers]
  );

  return {
    providers: Array.from(providers.values()),
    getProvider,
  };
}

