"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useFHECraftJury } from "@/hooks/useFHECraftJury";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { AlertCircle, Users, FileText, Award, Settings, Loader2 } from "lucide-react";

export default function AdminPage() {
  const { provider, account, chainId, isConnected } = useWallet();
  const { contract, isReady } = useFHECraftJury(provider || undefined, chainId);

  const [stats, setStats] = useState({
    workCount: 0,
    groupCount: 0,
    awardsPublished: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!isReady || !contract) return;

      setLoading(true);
      try {
        const workCount = await contract.workCount();
        const groupCount = await contract.groupCount();
        
        // Count published awards
        let publishedCount = 0;
        for (let i = 0; i < Number(groupCount); i++) {
          const award = await contract.publishedAwards(i);
          if (award.published) publishedCount++;
        }

        setStats({
          workCount: Number(workCount),
          groupCount: Number(groupCount),
          awardsPublished: publishedCount,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [isReady, contract]);

  const [showRegisterWork, setShowRegisterWork] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAggregateScores, setShowAggregateScores] = useState(false);
  const [showPublishAwards, setShowPublishAwards] = useState(false);
  const [activities, setActivities] = useState<Array<{
    message: string;
    timestamp: string;
  }>>([]);

  // Load recent activities from contract events
  useEffect(() => {
    async function loadActivities() {
      if (!contract) return;

      try {
        // Get recent events (last 100 blocks)
        const currentBlock = await contract.runner?.provider?.getBlockNumber();
        if (!currentBlock) return;

        const fromBlock = Math.max(0, currentBlock - 100);
        
        const filter = contract.filters;
        const events = await Promise.all([
          contract.queryFilter(filter.WorkRegistered(), fromBlock),
          contract.queryFilter(filter.ScoreSubmitted(), fromBlock),
          contract.queryFilter(filter.GroupAggregated(), fromBlock),
          contract.queryFilter(filter.AwardPublished(), fromBlock),
        ]);

        const allEvents = events.flat().sort((a, b) => b.blockNumber - a.blockNumber);
        
        const recentActivities = await Promise.all(
          allEvents.slice(0, 10).map(async (event) => {
            // Type guard for EventLog
            if (!('eventName' in event)) return null;

            const block = await event.getBlock();
            const timestamp = new Date(block.timestamp * 1000);
            const timeAgo = getTimeAgo(timestamp);

            if (event.eventName === "WorkRegistered") {
              return {
                message: `Work #${event.args?.workId} registered in Group ${event.args?.groupId}`,
                timestamp: timeAgo,
              };
            } else if (event.eventName === "ScoreSubmitted") {
              return {
                message: `Judge ${event.args?.judge.slice(0, 8)}... submitted score for Work #${event.args?.workId}`,
                timestamp: timeAgo,
              };
            } else if (event.eventName === "GroupAggregated") {
              return {
                message: `Group ${event.args?.groupId} aggregation completed`,
                timestamp: timeAgo,
              };
            } else if (event.eventName === "AwardPublished") {
              return {
                message: `Award published for Group ${event.args?.groupId}`,
                timestamp: timeAgo,
              };
            }
            return null;
          })
        );

        setActivities(recentActivities.filter(Boolean) as any);
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    }

    loadActivities();
  }, [contract]);

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  const statsCards = [
    {
      label: "Total Works",
      value: loading ? "..." : stats.workCount.toString(),
      icon: FileText,
      color: "craft-leather",
    },
    {
      label: "Active Judges",
      value: "—",
      icon: Users,
      color: "craft-walnut",
    },
    {
      label: "Groups",
      value: loading ? "..." : stats.groupCount.toString(),
      icon: Settings,
      color: "craft-brass",
    },
    {
      label: "Awards Published",
      value: loading ? "..." : `${stats.awardsPublished}/${stats.groupCount}`,
      icon: Award,
      color: "craft-forest",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Admin Dashboard</h1>
          <p className="text-[var(--text-secondary)]">
            Manage works, judges, groups, and award publication
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-craft-brass mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Please connect your wallet with admin role to access the dashboard
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {card.label}
                      </div>
                      <Icon className={`h-5 w-5 text-${card.color}`} />
                    </div>
                    <div className="text-3xl font-bold">{card.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8 mb-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="px-4 py-3 bg-craft-forest text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Create Group
                </button>
                <button 
                  onClick={() => setShowRegisterWork(true)}
                  className="px-4 py-3 bg-craft-leather text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Register Work
                </button>
                <button 
                  onClick={() => setShowAggregateScores(true)}
                  className="px-4 py-3 bg-craft-brass text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Aggregate Scores
                </button>
                <button 
                  onClick={() => setShowPublishAwards(true)}
                  className="px-4 py-3 bg-craft-forest text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Publish Awards
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-craft-leather rounded-full" />
                      <div className="flex-1">
                        <div className="text-sm">{activity.message}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {activity.timestamp}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[var(--text-secondary)] py-4">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <CreateGroupModal
            contract={contract}
            onClose={() => setShowCreateGroup(false)}
            onSuccess={() => {
              setShowCreateGroup(false);
              window.location.reload();
            }}
          />
        )}

        {/* Register Work Modal */}
        {showRegisterWork && (
          <RegisterWorkModal
            contract={contract}
            provider={provider}
            chainId={chainId}
            onClose={() => setShowRegisterWork(false)}
            onSuccess={() => {
              setShowRegisterWork(false);
              window.location.reload();
            }}
          />
        )}

        {/* Aggregate Scores Modal */}
        {showAggregateScores && (
          <AggregateScoresModal
            contract={contract}
            provider={provider}
            chainId={chainId}
            onClose={() => setShowAggregateScores(false)}
            onSuccess={() => {
              setShowAggregateScores(false);
              window.location.reload();
            }}
          />
        )}

        {/* Publish Awards Modal */}
        {showPublishAwards && (
          <PublishAwardsModal
            contract={contract}
            provider={provider}
            chainId={chainId}
            account={account}
            onClose={() => setShowPublishAwards(false)}
            onSuccess={() => {
              setShowPublishAwards(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Group Modal Component
function CreateGroupModal({ contract, onClose, onSuccess }: any) {
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setIsSubmitting(true);
    try {
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

      let groupId = "unknown";
      if (event) {
        const parsed = contract.interface.parseLog(event);
        groupId = parsed?.args?.groupId?.toString() || "unknown";
      }

      alert(`Group created successfully with ID: ${groupId}`);
      onSuccess();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 border border-[var(--border-color)]">
        <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
              placeholder="e.g., Group A, Leather Workshop 2024"
              required
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Choose a descriptive name for this evaluation group
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-craft-forest text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Register Work Modal Component
function RegisterWorkModal({ contract, provider, chainId, onClose, onSuccess }: any) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("0");
  const [groupId, setGroupId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Array<{id: number, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const { getGroupCount, getGroup } = useFHECraftJury(provider, chainId);

  // Load available groups on mount
  useEffect(() => {
    async function loadGroups() {
      if (!contract) return;

      try {
        const count = await getGroupCount();
        if (count === 0) {
          setAvailableGroups([]);
          setLoading(false);
          return;
        }

        const groups = await Promise.all(
          Array.from({ length: count }, async (_, i) => {
            const group = await getGroup(i);
            return group && group.exists ? { id: i, name: group.name } : null;
          })
        );

        setAvailableGroups(groups.filter(Boolean) as any);
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [contract, getGroupCount, getGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !groupId) return;

    setIsSubmitting(true);
    try {
      const tx = await contract.registerWork(title, parseInt(category), parseInt(groupId));
      await tx.wait();
      alert("Work registered successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error registering work:", error);
      alert("Failed to register work: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 border border-[var(--border-color)]">
        <h2 className="text-2xl font-bold mb-4">Register New Work</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading groups...</div>
        ) : availableGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] mb-4">
              No groups available. Please create a group first.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Work Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                placeholder="e.g., Leather Wallet"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
              >
                <option value="0">Leather</option>
                <option value="1">Wood</option>
                <option value="2">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                required
              >
                <option value="">Select a group...</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    Group {group.id}: {group.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {availableGroups.length} group(s) available
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-craft-leather text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Aggregate Scores Modal Component
function AggregateScoresModal({ contract, provider, chainId, onClose, onSuccess }: any) {
  const [groupId, setGroupId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Array<{id: number, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const { getGroupCount, getGroup } = useFHECraftJury(provider, chainId);

  // Load available groups on mount
  useEffect(() => {
    async function loadGroups() {
      if (!contract) return;

      try {
        const count = await getGroupCount();
        if (count === 0) {
          setAvailableGroups([]);
          setLoading(false);
          return;
        }

        const groups = await Promise.all(
          Array.from({ length: count }, async (_, i) => {
            const group = await getGroup(i);
            if (!group || !group.exists) return null;

            // Check if already aggregated
            const aggregate = await contract.groupAggregates(i);
            if (aggregate.aggregated) return null;

            return { id: i, name: group.name };
          })
        );

        setAvailableGroups(groups.filter(Boolean) as any);
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [contract, getGroupCount, getGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !groupId) return;

    setIsSubmitting(true);
    try {
      const tx = await contract.aggregateGroup(parseInt(groupId));
      await tx.wait();
      alert("Group scores aggregated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error aggregating scores:", error);
      alert("Failed to aggregate scores: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 border border-[var(--border-color)]">
        <h2 className="text-2xl font-bold mb-4">Aggregate Group Scores</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading groups...</div>
        ) : availableGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] mb-4">
              No groups available for aggregation. Groups must have scores submitted and not yet aggregated.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Group to Aggregate</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                required
              >
                <option value="">Select a group...</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    Group {group.id}: {group.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                This will calculate weighted average scores for all works in the group using FHEVM encryption
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
              <h3 className="text-sm font-semibold mb-2">About Aggregation</h3>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                <li>• Calculates average scores across all judges</li>
                <li>• Applies weights: Craftsmanship (40%), Detail (35%), Originality (25%)</li>
                <li>• All calculations happen on encrypted data (FHEVM)</li>
                <li>• Determines award tier based on thresholds</li>
              </ul>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-craft-brass text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Aggregating..." : "Aggregate Scores"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Publish Awards Modal Component
function PublishAwardsModal({ contract, provider, chainId, onClose, onSuccess, account }: any) {
  const [groupId, setGroupId] = useState("");
  const [decryptedScore, setDecryptedScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Array<{id: number, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const { getGroupCount, getGroup } = useFHECraftJury(provider, chainId);
  const { instance: fhevmInstance, isReady: isFhevmReady } = useFhevm({ provider, enabled: chainId === 31337 });
  const { storage: decryptionSignatureStorage } = useInMemoryStorage();

  // Load available groups on mount
  useEffect(() => {
    async function loadGroups() {
      if (!contract) return;

      try {
        const count = await getGroupCount();
        if (count === 0) {
          setAvailableGroups([]);
          setLoading(false);
          return;
        }

        const groups = await Promise.all(
          Array.from({ length: count }, async (_, i) => {
            const group = await getGroup(i);
            if (!group || !group.exists) return null;

            // Check if aggregated but not published
            const aggregate = await contract.groupAggregates(i);
            const published = await contract.publishedAwards(i);
            
            if (!aggregate.aggregated || published.published) return null;

            return { id: i, name: group.name };
          })
        );

        setAvailableGroups(groups.filter(Boolean) as any);
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [contract, getGroupCount, getGroup]);

  const handleAutoDecrypt = async () => {
    if (!contract || !groupId || !fhevmInstance || !account) {
      alert("Please select a group first and ensure wallet is connected");
      return;
    }

    // Only works in mock mode (local Hardhat)
    if (chainId !== 31337) {
      alert("Auto-decrypt only works in Mock mode (chainId 31337). Currently on chainId: " + chainId);
      return;
    }

    if (!provider) {
      alert("Provider not available");
      return;
    }

    setIsDecrypting(true);
    try {
      console.log("[Auto Decrypt] Starting decryption process...");
      
      // 1. Get the encrypted overall score from contract
      const aggregate = await contract.getGroupAggregate(parseInt(groupId));
      const encryptedScoreHandle = aggregate.overallScore;
      const contractAddress = await contract.getAddress();

      console.log("[Auto Decrypt] Encrypted score handle:", encryptedScoreHandle);
      console.log("[Auto Decrypt] Contract address:", contractAddress);

      // 2. Get ethersSigner
      const { ethers } = await import("ethers");
      const browserProvider = new ethers.BrowserProvider(provider);
      const ethersSigner = await browserProvider.getSigner();

      console.log("[Auto Decrypt] Signer address:", await ethersSigner.getAddress());

      // 3. Load or create decryption signature
      console.log("[Auto Decrypt] Loading/creating decryption signature...");
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress as `0x${string}`],
        ethersSigner,
        decryptionSignatureStorage
      );

      if (!sig) {
        throw new Error("Unable to build FHEVM decryption signature");
      }

      console.log("[Auto Decrypt] Signature created successfully");

      // 4. Call userDecrypt
      console.log("[Auto Decrypt] Calling FHEVM userDecrypt...");
      const decryptedResults = await fhevmInstance.userDecrypt(
        [{ handle: encryptedScoreHandle, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      console.log("[Auto Decrypt] Decryption completed!");
      console.log("[Auto Decrypt] Results:", decryptedResults);

      // 5. Extract the decrypted value
      const decryptedValue = Number(decryptedResults[encryptedScoreHandle]);
      
      console.log("[Auto Decrypt] Decrypted score:", decryptedValue);

      // 6. Fill the input
      setDecryptedScore(decryptedValue.toString());
      alert(`✅ Auto-decrypted score: ${decryptedValue}`);
    } catch (error) {
      console.error("[Auto Decrypt] Error:", error);
      alert("Failed to decrypt: " + (error as Error).message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !groupId || !decryptedScore) return;

    const score = parseInt(decryptedScore);
    if (score < 0 || score > 100) {
      alert("Score must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = await contract.publishAward(parseInt(groupId), score);
      await tx.wait();
      alert("Award published successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error publishing award:", error);
      alert("Failed to publish award: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 border border-[var(--border-color)]">
        <h2 className="text-2xl font-bold mb-4">Publish Award</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading groups...</div>
        ) : availableGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] mb-4">
              No groups available for award publication. Groups must be aggregated first and not yet published.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Group to Publish</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                required
              >
                <option value="">Select a group...</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    Group {group.id}: {group.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Only aggregated and unpublished groups are shown
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Decrypted Overall Score</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={decryptedScore}
                  onChange={(e) => setDecryptedScore(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                  placeholder="Enter score (0-100)"
                  min="0"
                  max="100"
                  required
                />
                {chainId === 31337 && (
                  <button
                    type="button"
                    onClick={handleAutoDecrypt}
                    disabled={!groupId || isDecrypting}
                    className="px-4 py-2 bg-craft-brass text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    title="Auto-decrypt in Mock mode (reads plaintext value from contract)"
                  >
                    {isDecrypting ? "Reading..." : "🔓 Auto Decrypt"}
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {chainId === 31337 ? (
                  <span>💡 Click "Auto Decrypt" to read the score from mock contract (plaintext in test mode)</span>
                ) : (
                  <span>⚠️ In production, this would come from the FHEVM decryption oracle automatically</span>
                )}
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
              <h3 className="text-sm font-semibold mb-2">Award Tier Thresholds</h3>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                <li>• 🥇 Gold: Score ≥ 85</li>
                <li>• 🥈 Silver: Score ≥ 75</li>
                <li>• 🥉 Bronze: Score ≥ 65</li>
                <li>• 📋 None: Score &lt; 65</li>
              </ul>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Once published, results become publicly visible and irreversible.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-craft-forest text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Publish Award"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
