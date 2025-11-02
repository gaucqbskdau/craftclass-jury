// Mock FHEVM implementation for local Hardhat development
import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import type { FhevmInstance } from "../fhevmTypes";

interface FhevmMockMetadata {
  ACLAddress: string;
  InputVerifierAddress: string;
  KMSVerifierAddress: string;
}

export async function fhevmMockCreateInstance(params: {
  rpcUrl: string;
  chainId: number;
  metadata: FhevmMockMetadata;
}): Promise<FhevmInstance> {
  console.log("[fhevmMock] Creating mock instance for chainId:", params.chainId);

  const provider = new JsonRpcProvider(params.rpcUrl);
  
  // Query InputVerifier contract's EIP712 domain to get the correct verifyingContract address
  const inputVerifierContract = new Contract(
    params.metadata.InputVerifierAddress,
    ["function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"],
    provider
  );
  
  let verifyingContractAddressInputVerification = params.metadata.InputVerifierAddress;
  let gatewayChainId = 55815;
  
  try {
    const domain = await inputVerifierContract.eip712Domain();
    verifyingContractAddressInputVerification = domain[4]; // index 4 is verifyingContract
    gatewayChainId = Number(domain[3]); // index 3 is chainId
    console.log("[fhevmMock] InputVerifier EIP712 domain chainId:", gatewayChainId);
    console.log("[fhevmMock] InputVerifier verifyingContract:", verifyingContractAddressInputVerification);
  } catch (error) {
    console.warn("[fhevmMock] Failed to query InputVerifier EIP712 domain, using defaults:", error);
  }
  
  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: params.metadata.ACLAddress as `0x${string}`,
      chainId: params.chainId,
      gatewayChainId,
      inputVerifierContractAddress: params.metadata.InputVerifierAddress as `0x${string}`,
      kmsContractAddress: params.metadata.KMSVerifierAddress as `0x${string}`,
      verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64" as `0x${string}`,
      verifyingContractAddressInputVerification: verifyingContractAddressInputVerification as `0x${string}`,
    },
    {
      // v0.3.0 requires this 4th parameter
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );

  console.log("[fhevmMock] ✅ Mock instance created successfully");

  return instance as unknown as FhevmInstance;
}
