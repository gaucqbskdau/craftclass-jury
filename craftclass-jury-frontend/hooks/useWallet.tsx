"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Eip1193Provider } from "ethers";
import { useEip6963 } from "./metamask/useEip6963";

const STORAGE_KEYS = {
  CONNECTED: "wallet.connected",
  LAST_CONNECTOR_ID: "wallet.lastConnectorId",
  LAST_ACCOUNTS: "wallet.lastAccounts",
  LAST_CHAIN_ID: "wallet.lastChainId",
} as const;

export interface WalletState {
  provider: Eip1193Provider | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export interface UseWalletResult extends WalletState {
  connect: (rdns?: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

export function useWallet(): UseWalletResult {
  const { providers, getProvider } = useEip6963();

  const [state, setState] = useState<WalletState>({
    provider: null,
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const providerRef = useRef<Eip1193Provider | null>(null);
  const silentReconnectAttempted = useRef(false);

  // Save connection state to localStorage
  const saveConnectionState = useCallback(
    (rdns: string, accounts: string[], chainId: number) => {
      localStorage.setItem(STORAGE_KEYS.CONNECTED, "true");
      localStorage.setItem(STORAGE_KEYS.LAST_CONNECTOR_ID, rdns);
      localStorage.setItem(STORAGE_KEYS.LAST_ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.LAST_CHAIN_ID, String(chainId));
    },
    []
  );

  // Clear connection state from localStorage
  const clearConnectionState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTOR_ID);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.LAST_CHAIN_ID);
  }, []);

  // Setup event listeners for provider
  const setupProviderListeners = useCallback((provider: Eip1193Provider, rdns: string) => {
    const handleAccountsChanged = (accounts: string[]) => {
      console.log("[Wallet] Accounts changed:", accounts);
      if (accounts.length === 0) {
        // Disconnected
        setState((prev) => ({
          ...prev,
          account: null,
          isConnected: false,
        }));
        clearConnectionState();
      } else {
        setState((prev) => ({
          ...prev,
          account: accounts[0],
          isConnected: true,
        }));
        // Update stored accounts
        const chainId = state.chainId || 0;
        saveConnectionState(rdns, accounts, chainId);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      console.log("[Wallet] Chain changed:", newChainId);
      setState((prev) => ({
        ...prev,
        chainId: newChainId,
      }));

      // Update stored chain ID
      const accounts = state.account ? [state.account] : [];
      saveConnectionState(rdns, accounts, newChainId);

      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    };

    const handleDisconnect = () => {
      console.log("[Wallet] Disconnected");
      setState((prev) => ({
        ...prev,
        provider: null,
        account: null,
        chainId: null,
        isConnected: false,
      }));
      clearConnectionState();
    };

    // Use optional chaining as not all providers support these methods
    if ("on" in provider && typeof provider.on === "function") {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);
    } else if ("addListener" in provider && typeof provider.addListener === "function") {
      provider.addListener("accountsChanged", handleAccountsChanged);
      provider.addListener("chainChanged", handleChainChanged);
      provider.addListener("disconnect", handleDisconnect);
    }

    return () => {
      if ("removeListener" in provider && typeof provider.removeListener === "function") {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
        provider.removeListener("disconnect", handleDisconnect);
      } else if ("off" in provider && typeof provider.off === "function") {
        provider.off("accountsChanged", handleAccountsChanged);
        provider.off("chainChanged", handleChainChanged);
        provider.off("disconnect", handleDisconnect);
      }
    };
  }, [clearConnectionState, saveConnectionState, state.account, state.chainId]);

  // Connect to wallet
  const connect = useCallback(
    async (rdns?: string) => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        let providerDetail;
        if (rdns) {
          providerDetail = getProvider(rdns);
        } else {
          // Use first available provider
          providerDetail = providers[0];
        }

        if (!providerDetail) {
          throw new Error("No wallet provider found");
        }

        const provider = providerDetail.provider;
        providerRef.current = provider;

        // Request accounts (shows wallet popup)
        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts.length === 0) {
          throw new Error("No accounts returned");
        }

        // Get chain ID
        const chainIdHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        const chainId = parseInt(chainIdHex, 16);

        setState((prev) => ({
          ...prev,
          provider,
          account: accounts[0],
          chainId,
          isConnected: true,
          isConnecting: false,
        }));

        // Save to localStorage
        saveConnectionState(providerDetail.info.rdns, accounts, chainId);

        // Setup listeners
        setupProviderListeners(provider, providerDetail.info.rdns);

        console.log("[Wallet] Connected:", accounts[0], "chainId:", chainId);
      } catch (error) {
        console.error("[Wallet] Connection error:", error);
        setState((prev) => ({
          ...prev,
          error: error as Error,
          isConnecting: false,
        }));
      }
    },
    [providers, getProvider, saveConnectionState, setupProviderListeners]
  );

  // Silent reconnect using eth_accounts (no popup)
  const silentReconnect = useCallback(async () => {
    if (silentReconnectAttempted.current) return;
    silentReconnectAttempted.current = true;

    const wasConnected = localStorage.getItem(STORAGE_KEYS.CONNECTED);
    const lastRdns = localStorage.getItem(STORAGE_KEYS.LAST_CONNECTOR_ID);

    if (!wasConnected || !lastRdns) return;

    try {
      // Try to get provider from EIP-6963
      let providerDetail = getProvider(lastRdns);
      
      // Fallback: if EIP-6963 hasn't discovered it yet, try window.ethereum
      if (!providerDetail && typeof window !== "undefined" && "ethereum" in window) {
        console.log("[Wallet] Using fallback window.ethereum for silent reconnect");
        const ethereumProvider = (window as any).ethereum;
        if (ethereumProvider) {
          providerRef.current = ethereumProvider;

          // Use eth_accounts (silent, no popup)
          const accounts = (await ethereumProvider.request({
            method: "eth_accounts",
          })) as string[];

          if (accounts.length === 0) {
            clearConnectionState();
            return;
          }

          // Get chain ID
          const chainIdHex = (await ethereumProvider.request({
            method: "eth_chainId",
          })) as string;
          const chainId = parseInt(chainIdHex, 16);

          setState((prev) => ({
            ...prev,
            provider: ethereumProvider,
            account: accounts[0],
            chainId,
            isConnected: true,
          }));

          // Setup listeners
          setupProviderListeners(ethereumProvider, lastRdns);

          console.log("[Wallet] Silent reconnect successful (fallback):", accounts[0]);
          return;
        }
      }

      if (!providerDetail) return;

      const provider = providerDetail.provider;
      providerRef.current = provider;

      // Use eth_accounts (silent, no popup)
      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as string[];

      if (accounts.length === 0) {
        clearConnectionState();
        return;
      }

      // Get chain ID
      const chainIdHex = (await provider.request({
        method: "eth_chainId",
      })) as string;
      const chainId = parseInt(chainIdHex, 16);

      setState((prev) => ({
        ...prev,
        provider,
        account: accounts[0],
        chainId,
        isConnected: true,
      }));

      // Setup listeners
      setupProviderListeners(provider, lastRdns);

      console.log("[Wallet] Silent reconnect successful:", accounts[0]);
    } catch (error) {
      console.error("[Wallet] Silent reconnect failed:", error);
      clearConnectionState();
    }
  }, [getProvider, clearConnectionState, setupProviderListeners]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      provider: null,
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    clearConnectionState();
    providerRef.current = null;
    console.log("[Wallet] Disconnected");
  }, [clearConnectionState]);

  // Switch chain
  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!providerRef.current) {
        throw new Error("No provider connected");
      }

      try {
        const chainIdHex = `0x${targetChainId.toString(16)}`;
        await providerRef.current.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (error) {
        console.error("[Wallet] Switch chain error:", error);
        throw error;
      }
    },
    []
  );

  // Silent reconnect on mount
  useEffect(() => {
    // Try immediately
    silentReconnect();
    
    // Also try again after a delay if providers are discovered
    const timer = setTimeout(() => {
      if (providers.length > 0 && !state.isConnected) {
        silentReconnectAttempted.current = false; // Reset to allow retry
        silentReconnect();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [providers.length]); // Remove silentReconnect from deps to avoid infinite loop

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
  };
}

