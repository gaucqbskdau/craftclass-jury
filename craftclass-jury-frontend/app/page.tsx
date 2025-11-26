"use client";

import Link from "next/link";
import { Lock, Scale, Trophy, ArrowRight, GitBranch } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";

export default function HomePage() {
  const { isConnected, account } = useWallet();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-craft-leather/10 via-craft-walnut/10 to-craft-brass/10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
              CraftClass Jury
            </h1>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8">
              Privacy-Preserving Workshop Evaluation System
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/judge/score"
                className="inline-flex items-center justify-center px-8 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-semibold transition-colors"
              >
                {isConnected ? `Score Works (${account?.slice(0, 6)}...)` : "Connect Wallet"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center justify-center px-8 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-lg font-semibold transition-colors border border-[var(--border-color)]"
              >
                View Public Results
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-craft-leather/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-craft-leather" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Confidential Scoring
              </h3>
              <p className="text-[var(--text-secondary)]">
                Judges score privately using FHEVM encryption. Individual scores
                remain encrypted and never revealed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-craft-brass/20 rounded-lg flex items-center justify-center mb-4">
                <Scale className="h-6 w-6 text-craft-brass" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Fair Aggregation
              </h3>
              <p className="text-[var(--text-secondary)]">
                Group averages computed without revealing individual scores. All
                calculations happen on encrypted data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-craft-forest/20 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-craft-forest" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Transparent Awards
              </h3>
              <p className="text-[var(--text-secondary)]">
                Award winners published while protecting judge privacy. Only group
                averages are decrypted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-craft-leather text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Judges Connect Wallet</h3>
                <p className="text-[var(--text-secondary)]">
                  Authorized judges connect their wallet and authenticate to access
                  assigned works.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-craft-walnut text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Submit Encrypted Scores</h3>
                <p className="text-[var(--text-secondary)]">
                  Judges score works across three dimensions (craftsmanship, detail,
                  originality). Scores are encrypted client-side using FHEVM before
                  submission.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-craft-brass text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Admin Aggregates</h3>
                <p className="text-[var(--text-secondary)]">
                  After scoring deadline, admin triggers aggregation. Group averages
                  are computed using encrypted operations (FHE.add).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-craft-forest text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Awards Published</h3>
                <p className="text-[var(--text-secondary)]">
                  Award tiers (Gold/Silver/Bronze) are determined and published. Only
                  group averages are decrypted, individual scores remain private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <GitBranch className="h-4 w-4" />
              <span>v1.0.0</span>
            </div>
            <div className="flex gap-6">
              <a
                href="https://docs.zama.ai/fhevm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                FHEVM Documentation
              </a>
              <a
                href="https://github.com/zama-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

