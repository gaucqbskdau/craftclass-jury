import { RELAYER_SDK_CDN_URL } from "./constants";
import type { FhevmRelayerSDK, FhevmWindowType } from "./fhevmTypes";

export class RelayerSDKLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelayerSDKLoadError";
  }
}

export class RelayerSDKLoader {
  private trace?: (...args: unknown[]) => void;

  constructor(options?: { trace?: (...args: unknown[]) => void }) {
    this.trace = options?.trace;
  }

  isLoaded(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return this.isValidWindowWithSDK(window);
  }

  async load(): Promise<void> {
    this.trace?.("[RelayerSDKLoader] Starting load...");

    if (typeof window === "undefined") {
      throw new RelayerSDKLoadError("Window is undefined (not in browser)");
    }

    // Check if already loaded
    if (this.isValidWindowWithSDK(window)) {
      this.trace?.("[RelayerSDKLoader] Already loaded");
      return Promise.resolve();
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      `script[src="${RELAYER_SDK_CDN_URL}"]`
    );
    if (existingScript) {
      if (this.isValidWindowWithSDK(window)) {
        return Promise.resolve();
      }
      throw new RelayerSDKLoadError(
        "Script exists but window.relayerSDK is invalid"
      );
    }

    // Load SDK via script tag
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RELAYER_SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        this.trace?.("[RelayerSDKLoader] Script loaded");
        if (!this.isValidWindowWithSDK(window)) {
          reject(
            new RelayerSDKLoadError(
              "Script loaded but window.relayerSDK is invalid"
            )
          );
          return;
        }
        resolve();
      };

      script.onerror = () => {
        this.trace?.("[RelayerSDKLoader] Script load error");
        reject(
          new RelayerSDKLoadError(
            `Failed to load SDK from ${RELAYER_SDK_CDN_URL}`
          )
        );
      };

      document.head.appendChild(script);
      this.trace?.("[RelayerSDKLoader] Script tag added to DOM");
    });
  }

  private isValidWindowWithSDK(win: Window): win is FhevmWindowType {
    if (!("relayerSDK" in win)) {
      return false;
    }
    return this.isValidSDK(win.relayerSDK);
  }

  private isValidSDK(sdk: unknown): sdk is FhevmRelayerSDK {
    if (!sdk || typeof sdk !== "object") {
      return false;
    }

    const s = sdk as Record<string, unknown>;
    if (typeof s.initSDK !== "function") {
      this.trace?.("initSDK is not a function");
      return false;
    }
    if (typeof s.createInstance !== "function") {
      this.trace?.("createInstance is not a function");
      return false;
    }
    if (!s.SepoliaConfig || typeof s.SepoliaConfig !== "object") {
      this.trace?.("SepoliaConfig is invalid");
      return false;
    }

    return true;
  }
}

export function isWindowWithSDK(win: unknown): win is FhevmWindowType {
  if (!win || typeof win !== "object" || !("relayerSDK" in win)) {
    return false;
  }
  const w = win as { relayerSDK: unknown };
  if (!w.relayerSDK || typeof w.relayerSDK !== "object") {
    return false;
  }
  const sdk = w.relayerSDK as Record<string, unknown>;
  return (
    typeof sdk.initSDK === "function" &&
    typeof sdk.createInstance === "function" &&
    typeof sdk.SepoliaConfig === "object"
  );
}

