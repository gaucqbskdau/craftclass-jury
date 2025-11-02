"use client";

import { useState, useCallback, useEffect } from "react";
import { Contract, BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { FHECraftJuryABI } from "@/abi/FHECraftJuryABI";
import { FHECraftJuryAddresses } from "@/abi/FHECraftJuryAddresses";

export interface Work {
  id: bigint;
  title: string;
  category: number;
  groupId: bigint;
  timestamp: bigint;
  exists: boolean;
}

export interface Score {
  craftsmanship: number;
  detail: number;
  originality: number;
}

export function useFHECraftJury(provider?: Eip1193Provider, chainId?: number | null) {
  const { instance: fhevmInstance, isReady: isFhevmReady } = useFhevm({
    provider,
    enabled: !!provider,
  });

  const [contract, setContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!provider || !chainId) {
      setContract(null);
      return;
    }

    const address = FHECraftJuryAddresses[chainId];
    if (!address) {
      console.error(`Contract not deployed on chain ${chainId}`);
      setContract(null);
      return;
    }

    const browserProvider = new BrowserProvider(provider);
    browserProvider.getSigner().then((signer) => {
      const contractInstance = new Contract(address, FHECraftJuryABI, signer);
      setContract(contractInstance);
    });
  }, [provider, chainId]);

  // Submit encrypted score
  const submitScore = useCallback(
    async (workId: number, score: Score, userAddress: string) => {
      if (!contract || !fhevmInstance || !isFhevmReady) {
        throw new Error("Contract or FHEVM instance not ready");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        console.log("[useFHECraftJury] Encrypting scores...");

        const contractAddress = await contract.getAddress();

        // Create encrypted input with correct FHEVM API
        const input = fhevmInstance.createEncryptedInput(
          contractAddress,
          userAddress
        );
        
        // Add three uint16 values
        input.add16(score.craftsmanship);
        input.add16(score.detail);
        input.add16(score.originality);

        // Encrypt and get handles + proof
        const encryptedData = await input.encrypt();

        console.log("[useFHECraftJury] Submitting to contract...");

        // Submit to contract with handles and proof
        const tx = await contract.submitScore(
          workId,
          encryptedData.handles[0], // craftsmanship
          encryptedData.handles[1], // detail
          encryptedData.handles[2], // originality
          encryptedData.inputProof
        );

        console.log("[useFHECraftJury] Transaction sent:", tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("[useFHECraftJury] Transaction confirmed:", receipt.hash);

        return {
          success: true,
          txHash: receipt.hash,
        };
      } catch (err) {
        console.error("[useFHECraftJury] Error submitting score:", err);
        setError(err as Error);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [contract, fhevmInstance, isFhevmReady]
  );

  // Get work details
  const getWork = useCallback(
    async (workId: number): Promise<Work | null> => {
      if (!contract) return null;

      try {
        const work = await contract.getWork(workId);
        return {
          id: work.id,
          title: work.title,
          category: Number(work.category),
          groupId: work.groupId,
          timestamp: work.timestamp,
          exists: work.exists,
        };
      } catch (err) {
        console.error("[useFHECraftJury] Error getting work:", err);
        return null;
      }
    },
    [contract]
  );

  // Check if judge has scored a work
  const hasJudgeScoredWork = useCallback(
    async (workId: number, judgeAddress: string): Promise<boolean> => {
      if (!contract) return false;

      try {
        return await contract.hasJudgeScoredWork(workId, judgeAddress);
      } catch (err) {
        console.error("[useFHECraftJury] Error checking score:", err);
        return false;
      }
    },
    [contract]
  );

  // Get work count
  const getWorkCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.workCount();
      return Number(count);
    } catch (err) {
      console.error("[useFHECraftJury] Error getting work count:", err);
      return 0;
    }
  }, [contract]);

  // Create a new group
  const createGroup = useCallback(
    async (groupName: string): Promise<number | null> => {
      if (!contract) {
        console.error("[useFHECraftJury] Contract not ready");
        return null;
      }

      try {
        console.log("[useFHECraftJury] Creating group:", groupName);
        const tx = await contract.createGroup(groupName);
        const receipt = await tx.wait();

        // Find GroupCreated event to get the groupId
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === "GroupCreated";
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = contract.interface.parseLog(event);
          const groupId = Number(parsed?.args?.groupId);
          console.log("[useFHECraftJury] Group created with ID:", groupId);
          return groupId;
        }

        return null;
      } catch (error) {
        console.error("[useFHECraftJury] Error creating group:", error);
        throw error;
      }
    },
    [contract]
  );

  // Get group info
  const getGroup = useCallback(
    async (groupId: number): Promise<any> => {
      if (!contract) return null;

      try {
        const group = await contract.groups(groupId);
        return {
          id: Number(group.id),
          name: group.name,
          exists: group.exists,
        };
      } catch (error) {
        console.error("[useFHECraftJury] Error getting group:", error);
        return null;
      }
    },
    [contract]
  );

  // Get group count
  const getGroupCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.groupCount();
      return Number(count);
    } catch (err) {
      console.error("[useFHECraftJury] Error getting group count:", err);
      return 0;
    }
  }, [contract]);

  return {
    contract,
    submitScore,
    getWork,
    hasJudgeScoredWork,
    getWorkCount,
    createGroup,
    getGroup,
    getGroupCount,
    isSubmitting,
    error,
    isReady: !!contract && isFhevmReady,
  };
}

