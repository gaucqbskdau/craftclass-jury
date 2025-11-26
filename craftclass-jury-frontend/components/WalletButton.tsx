"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, ChevronDown, Copy, LogOut, AlertCircle } from "lucide-react";

export function WalletButton() {
  const { account, chainId, isConnected, isConnecting, connect, disconnect, error } =
    useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      // Could add a toast notification here
    }
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return "Unknown";
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 31337:
        return "Hardhat Local";
      default:
        return `Chain ${chainId}`;
    }
  };

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>

        {/* Connection Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 border border-[var(--border-color)]">
              <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
              <button
                onClick={() => {
                  connect();
                  setShowModal(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <Wallet className="h-6 w-6" />
                <span className="font-medium">Connect with MetaMask</span>
              </button>
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error.message}
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 w-full px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg transition-colors"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-craft-leather to-craft-brass rounded-full" />
        <span className="font-medium text-sm">{truncateAddress(account!)}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                Connected to {getNetworkName(chainId)}
              </div>
              <div className="font-mono text-sm">{account}</div>
            </div>
            <div className="p-2">
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-sm text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

