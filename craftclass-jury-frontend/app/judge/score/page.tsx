"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useFHECraftJury } from "@/hooks/useFHECraftJury";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function JudgeScorePage() {
  const { provider, account, chainId, isConnected } = useWallet();
  const { submitScore, getWork, getWorkCount, hasJudgeScoredWork, isSubmitting, isReady } =
    useFHECraftJury(provider || undefined, chainId);

  const [workId, setWorkId] = useState(0);
  const [workCount, setWorkCount] = useState(0);
  const [works, setWorks] = useState<Array<{id: number; title: string; category: string}>>([]);
  const [hasScored, setHasScored] = useState(false);

  const [scores, setScores] = useState({
    craftsmanship: 50,
    detail: 50,
    originality: 50,
  });

  const [submitStatus, setSubmitStatus] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    txHash?: string;
  }>({ status: "idle", message: "" });

  // Load work count and works
  useEffect(() => {
    if (isReady) {
      getWorkCount().then(async (count) => {
        setWorkCount(count);
        
        // Load all works
        const loadedWorks = [];
        for (let i = 0; i < count; i++) {
          const work = await getWork(i);
          if (work) {
            const categoryNames = ["Leather", "Wood", "Mixed"];
            loadedWorks.push({
              id: Number(work.id),
              title: work.title,
              category: categoryNames[work.category] || "Unknown"
            });
          }
        }
        setWorks(loadedWorks);
      });
    }
  }, [isReady, getWorkCount, getWork]);

  // Check if already scored
  useEffect(() => {
    if (isReady && account) {
      hasJudgeScoredWork(workId, account).then(setHasScored);
    }
  }, [isReady, account, workId, hasJudgeScoredWork]);

  const handleSubmit = async () => {
    if (!isConnected || !account) {
      setSubmitStatus({
        status: "error",
        message: "Please connect your wallet first",
      });
      return;
    }

    if (hasScored) {
      setSubmitStatus({
        status: "error",
        message: "You have already scored this work",
      });
      return;
    }

    try {
      const result = await submitScore(workId, scores, account);
      setSubmitStatus({
        status: "success",
        message: "Score submitted successfully!",
        txHash: result.txHash,
      });
      setHasScored(true);
    } catch (error) {
      setSubmitStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to submit score",
      });
    }
  };

  const weightedScore = (
    scores.craftsmanship * 0.4 +
    scores.detail * 0.35 +
    scores.originality * 0.25
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Score Works</h1>
          <p className="text-[var(--text-secondary)]">
            Submit confidential scores for craft prototypes
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-craft-brass mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Please connect your wallet to access the scoring interface
            </p>
          </div>
        ) : !isReady ? (
          <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-craft-leather mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading FHEVM...</h2>
            <p className="text-[var(--text-secondary)]">
              Initializing encrypted computation environment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Work List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-6">
                <h2 className="font-semibold mb-4">Works ({works.length})</h2>
                <div className="space-y-2">
                  {works.length > 0 ? (
                    works.map((work) => (
                      <button
                        key={work.id}
                        onClick={() => setWorkId(work.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          workId === work.id
                            ? "bg-craft-leather/10 border-2 border-craft-leather"
                            : "bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-craft-leather/5"
                        }`}
                      >
                        <div className="font-medium">{work.title}</div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          Category: {work.category}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-[var(--text-secondary)] py-4">
                      No works registered yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring Panel */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-8">
                <h2 className="text-2xl font-display font-bold mb-6">
                  Score Work #{workId}
                </h2>

                {hasScored && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You have already scored this work
                    </p>
                  </div>
                )}

                {/* Scoring Sliders */}
                <div className="space-y-6 mb-8">
                  {/* Craftsmanship */}
                  <div>
                    <label className="block font-medium mb-2">
                      Craftsmanship
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">
                        Weight: 40%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scores.craftsmanship}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          craftsmanship: parseInt(e.target.value),
                        }))
                      }
                      disabled={hasScored}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>0</span>
                      <span className="font-semibold text-lg">
                        {scores.craftsmanship}
                      </span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Detail */}
                  <div>
                    <label className="block font-medium mb-2">
                      Detail Quality
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">
                        Weight: 35%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scores.detail}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          detail: parseInt(e.target.value),
                        }))
                      }
                      disabled={hasScored}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>0</span>
                      <span className="font-semibold text-lg">
                        {scores.detail}
                      </span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Originality */}
                  <div>
                    <label className="block font-medium mb-2">
                      Originality
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">
                        Weight: 25%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scores.originality}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          originality: parseInt(e.target.value),
                        }))
                      }
                      disabled={hasScored}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>0</span>
                      <span className="font-semibold text-lg">
                        {scores.originality}
                      </span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 mb-6">
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    Weighted Score Preview:
                  </div>
                  <div className="text-2xl font-bold text-craft-leather">
                    {weightedScore} / 100
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-2">
                    ({scores.craftsmanship} × 0.4) + ({scores.detail} × 0.35) + (
                    {scores.originality} × 0.25)
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={hasScored || isSubmitting}
                  className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Encrypting & Submitting...
                    </>
                  ) : (
                    "Submit Encrypted Score"
                  )}
                </button>

                {/* Status Messages */}
                {submitStatus.status === "success" && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          {submitStatus.message}
                        </p>
                        {submitStatus.txHash && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                            Tx: {submitStatus.txHash.slice(0, 10)}...
                            {submitStatus.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus.status === "error" && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {submitStatus.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

