import type { Eip1193Provider } from "ethers";

// Type definitions for FHEVM Relayer SDK (from window.relayerSDK)
export interface FhevmRelayerSDK {
  initSDK: (options?: unknown) => Promise<boolean>;
  createInstance: (config: unknown) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    [key: string]: unknown;
  };
  __initialized__?: boolean;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDK;
}

export interface EncryptedInput {
  add16(value: number): EncryptedInput;
  add32(value: number): EncryptedInput;
  add64(value: bigint): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  encrypt(): Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

export interface HandleContractPair {
  handle: string;
  contractAddress: string;
}

// v0.3.0 renamed this type
export type UserDecryptResults = Record<string, bigint>;
// Backward compatibility alias
export type DecryptedResults = UserDecryptResults;

export interface FhevmInstance {
  getPublicKey(): string;
  getPublicParams(size: number): string;
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  createEIP712(
    verifyingContract: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  generateKeypair(): { publicKey: string; privateKey: string };
  userDecrypt(
    handles: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: `0x${string}`[],
    userAddress: `0x${string}`,
    startTimestamp: number,
    durationDays: number
  ): Promise<DecryptedResults>;
  [key: string]: unknown;
}

export interface FhevmInstanceConfig {
  network: Eip1193Provider | string;
  publicKey: string;
  publicParams: string;
  aclContractAddress: string;
  [key: string]: unknown;
}

export interface FhevmInitOptions {
  mockChains?: Record<number, string>;
  onStatusChange?: (status: FhevmStatus) => void;
}

export type FhevmStatus =
  | "idle"
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating"
  | "ready"
  | "error";

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

