"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useFHECraftJury } from "@/hooks/useFHECraftJury";
import { Trophy, Award, Medal, Loader2, FileText } from "lucide-react";

interface GroupResult {
  groupId: number;
  groupName: string;
  score: number;
  tier: "Gold" | "Silver" | "Bronze" | "None";
  workCount: number;
}

const tierColors = {
  Gold: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-700 dark:text-yellow-300",
    icon: Trophy,
  },
  Silver: {
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
    text: "text-gray-700 dark:text-gray-300",
    icon: Award,
  },
  Bronze: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-700 dark:text-orange-300",
    icon: Medal,
  },
  None: {
    bg: "bg-[var(--bg-secondary)]",
    border: "border-[var(--border-color)]",
    text: "text-[var(--text-secondary)]",
    icon: FileText,
  },
};

export default function ResultsPage() {
  const { provider, chainId } = useWallet();
  const { contract, isReady } = useFHECraftJury(provider || undefined, chainId);
  const [results, setResults] = useState<GroupResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      if (!isReady || !contract) return;

      setLoading(true);
      try {
        const groupCount = await contract.groupCount();
        const loadedResults: GroupResult[] = [];

        for (let i = 0; i < Number(groupCount); i++) {
          const publishedAward = await contract.publishedAwards(i);

          if (publishedAward.published) {
            // Get full group data including workIds
            const group = await contract.getGroup(i);
            const tierNames = ["None", "Bronze", "Silver", "Gold"];
            
            loadedResults.push({
              groupId: i,
              groupName: group.name || `Group ${i}`,
              score: Number(publishedAward.score),
              tier: tierNames[Number(publishedAward.tier)] as any,
              workCount: group.workIds?.length || 0,
            });
          }
        }

        setResults(loadedResults);
      } catch (error) {
        console.error("Error loading results:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [isReady, contract]);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">Award Results</h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Published group average scores and award tiers. Individual judge scores
            remain encrypted and private.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-craft-leather mx-auto mb-4 animate-spin" />
            <p className="text-[var(--text-secondary)]">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
            <Trophy className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No awards have been published yet</p>
          </div>
        ) : (
          <>
            {/* Award Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {results.map((result) => {
            const tierStyle = tierColors[result.tier as keyof typeof tierColors];
            const Icon = tierStyle.icon;

            return (
              <div
                key={result.groupId}
                className={`${tierStyle.bg} border-2 ${tierStyle.border} rounded-xl p-6 hover:shadow-xl transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-1">
                      {result.groupName}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {result.workCount} works
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${tierStyle.text}`} />
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold mb-1">{result.score}</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    Group Average Score
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 ${tierStyle.bg} border ${tierStyle.border} rounded-full`}
                >
                  <span className={`font-semibold text-sm ${tierStyle.text}`}>
                    {result.tier} Award
                  </span>
                </div>
              </div>
            );
          })}
            </div>
          </>
        )}

        {/* Timeline */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8">
          <h2 className="text-2xl font-display font-bold mb-6">Evaluation Timeline</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-craft-leather rounded-full" />
              <div>
                <div className="font-semibold">Scoring Period</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Nov 1, 2025 → Nov 10, 2025
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-craft-walnut rounded-full" />
              <div>
                <div className="font-semibold">Score Aggregation</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Nov 11, 2025, 10:00 AM
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-craft-forest rounded-full" />
              <div>
                <div className="font-semibold">Awards Published</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Nov 12, 2025, 2:00 PM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 p-6 bg-craft-leather/5 border border-craft-leather/20 rounded-lg">
          <h3 className="font-semibold mb-2">Privacy Guarantee</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Individual judge scores are encrypted using FHEVM and never decrypted.
            Only group averages are revealed after aggregation. Judge identities and
            individual evaluations remain confidential.
          </p>
        </div>
      </div>
    </div>
  );
}

