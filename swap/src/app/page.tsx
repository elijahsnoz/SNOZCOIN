/**
 * Swap Page
 * 
 * Main entry point for the swap feature.
 */

'use client';

import { SwapCard } from '@/components/SwapCard';

export default function SwapPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/assets/SNOZCOIN-128.png"
                alt="SNOZCOIN"
                className="w-8 h-8"
              />
              <span className="font-bold text-white">SNOZCOIN</span>
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Home
              </a>
              <a
                href="/swap"
                className="text-yellow-500 font-medium text-sm"
              >
                Swap
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Swap USDT ⇄ SOL
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Instant, non-custodial swaps powered by Jupiter.
            Connect your wallet and trade in seconds.
          </p>
        </div>

        {/* Swap Card */}
        <SwapCard />

        {/* Features */}
        <div className="max-w-2xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="font-medium text-white mb-1">Non-Custodial</h3>
            <p className="text-sm text-gray-400">
              Your keys, your coins. We never hold your funds.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-medium text-white mb-1">Best Rates</h3>
            <p className="text-sm text-gray-400">
              Jupiter aggregates 20+ DEXes for optimal pricing.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-medium text-white mb-1">Secure</h3>
            <p className="text-sm text-gray-400">
              All swaps are on-chain and verifiable.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="https://jup.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >
              Jupiter
            </a>{' '}
            on Solana
          </p>
          <p className="mt-2">
            © 2026 SNOZCOIN. Open source on{' '}
            <a
              href="https://github.com/elijahsnoz/SNOZCOIN"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
