import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type {
  FhevmInstance,
  FhevmInstanceConfig,
  FhevmStatus,
  FhevmWindowType,
} from "./fhevmTypes";
import { RelayerSDKLoader, isWindowWithSDK } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";
import { DEFAULT_MOCK_CHAINS } from "./constants";

export class FhevmError extends Error {
  code: string;
  constructor(code: string, message: string, cause?: unknown) {
    super(message, cause ? { cause } : undefined);
    this.code = code;
    this.name = "FhevmError";
  }
}

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

// Get chain ID from provider
async function resolveChainId(
  provider: Eip1193Provider | string
): Promise<number> {
  if (typeof provider === "string") {
    const jsonRpc = new JsonRpcProvider(provider);
    const network = await jsonRpc.getNetwork();
    return Number(network.chainId);
  }
  const chainIdHex = (await provider.request({
    method: "eth_chainId",
  })) as string;
  return parseInt(chainIdHex, 16);
}

// Check if chain is mock (local hardhat)
function isMockChain(
  chainId: number,
  mockChains?: Record<number, string>
): boolean {
  const allMockChains = { ...DEFAULT_MOCK_CHAINS, ...(mockChains || {}) };
  return chainId in allMockChains;
}

// Get RPC URL for mock chain
function getMockRpcUrl(
  chainId: number,
  provider: Eip1193Provider | string,
  mockChains?: Record<number, string>
): string {
  const allMockChains = { ...DEFAULT_MOCK_CHAINS, ...(mockChains || {}) };
  return typeof provider === "string" ? provider : allMockChains[chainId];
}

// Check if endpoint is Hardhat node with FHEVM
async function checkFhevmHardhatNode(rpcUrl: string): Promise<{
  ACLAddress: string;
  InputVerifierAddress: string;
  KMSVerifierAddress: string;
} | null> {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    // Check if it's Hardhat
    const version = await rpc.send("web3_clientVersion", []);
    if (!version || !String(version).toLowerCase().includes("hardhat")) {
      return null;
    }

    // Try to get FHEVM metadata
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    if (
      !metadata ||
      typeof metadata !== "object" ||
      !("ACLAddress" in metadata) ||
      !("InputVerifierAddress" in metadata) ||
      !("KMSVerifierAddress" in metadata)
    ) {
      return null;
    }

    return metadata as {
      ACLAddress: string;
      InputVerifierAddress: string;
      KMSVerifierAddress: string;
    };
  } catch (error) {
    console.warn("Not a FHEVM Hardhat node:", error);
    return null;
  } finally {
    rpc.destroy();
  }
}

// Main function to create FHEVM instance
export async function createFhevmInstance(params: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmStatus) => void;
}): Promise<FhevmInstance> {
  const { provider, mockChains, signal, onStatusChange } = params;

  const checkAborted = () => {
    if (signal.aborted) {
      throw new FhevmAbortError();
    }
  };

  const notifyStatus = (status: FhevmStatus) => {
    onStatusChange?.(status);
  };

  // Resolve chain ID
  const chainId = await resolveChainId(provider);
  checkAborted();

  // Check if mock chain
  if (isMockChain(chainId, mockChains)) {
    const rpcUrl = getMockRpcUrl(chainId, provider, mockChains);
    const metadata = await checkFhevmHardhatNode(rpcUrl);
    checkAborted();

    if (metadata) {
      notifyStatus("creating");
      console.log("[FHEVM] Using mock instance for local Hardhat");

      // Dynamic import to avoid bundling in production
      const { fhevmMockCreateInstance } = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata,
      });
      checkAborted();

      notifyStatus("ready");
      return mockInstance;
    }
  }

  // Production path: Load Relayer SDK
  console.log("[FHEVM] Using production Relayer SDK");

  if (!isWindowWithSDK(window)) {
    notifyStatus("sdk-loading");
    const loader = new RelayerSDKLoader({ trace: console.log });
    await loader.load();
    checkAborted();
    notifyStatus("sdk-loaded");
  }

  const win = window as unknown as FhevmWindowType;
  const sdk = win.relayerSDK;

  // Initialize SDK if not already initialized
  if (!sdk.__initialized__) {
    notifyStatus("sdk-initializing");
    const initialized = await sdk.initSDK();
    if (!initialized) {
      throw new FhevmError("SDK_INIT_FAILED", "Failed to initialize Relayer SDK");
    }
    sdk.__initialized__ = true;
    checkAborted();
    notifyStatus("sdk-initialized");
  }

  // Get ACL address from config
  const aclAddress = sdk.SepoliaConfig.aclContractAddress;
  if (!isAddress(aclAddress)) {
    throw new FhevmError("INVALID_ACL_ADDRESS", `Invalid ACL address: ${aclAddress}`);
  }

  // Retrieve or generate public key
  const storedKey = await publicKeyStorageGet(aclAddress);
  checkAborted();

  const config: FhevmInstanceConfig = {
    ...sdk.SepoliaConfig,
    network: provider,
    publicKey: storedKey.publicKey,
    publicParams: storedKey.publicParams,
    aclContractAddress: aclAddress,
  };

  notifyStatus("creating");
  const instance = await sdk.createInstance(config);
  checkAborted();

  // Save public key
  await publicKeyStorageSet(
    aclAddress,
    instance.getPublicKey(),
    instance.getPublicParams(2048)
  );

  notifyStatus("ready");
  return instance;
}

