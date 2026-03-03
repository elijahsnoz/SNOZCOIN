/**
 * Main Swap Component
 * 
 * Production-ready swap UI with:
 * - Token selection
 * - Amount input
 * - Quote display
 * - Slippage settings
 * - Transaction status
 */

'use client';

import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useSwap, SwapStatus } from '@/lib/useSwap';
import { TokenSelector } from './TokenSelector';
import { formatPriceImpact, getPriceImpactLevel } from '@/lib/jupiter';

export const SwapCard: FC = () => {
  const { connected, publicKey } = useWallet();
  const [state, actions, balances] = useSwap();

  // Get balance for input token
  const inputBalance = balances.balances[state.inputToken.symbol];
  const hasInsufficientBalance =
    inputBalance && parseFloat(state.inputAmount || '0') > inputBalance.uiBalance;

  // Determine button state
  const getButtonState = () => {
    if (!connected) return { text: 'Connect Wallet', disabled: true };
    if (!state.inputAmount) return { text: 'Enter amount', disabled: true };
    if (hasInsufficientBalance) return { text: 'Insufficient balance', disabled: true };
    if (state.status === 'fetching-quote') return { text: 'Fetching quote...', disabled: true };
    if (state.status === 'building-tx') return { text: 'Building transaction...', disabled: true };
    if (state.status === 'awaiting-signature') return { text: 'Confirm in wallet...', disabled: true };
    if (state.status === 'confirming') return { text: 'Confirming...', disabled: true };
    if (state.status === 'error' && !state.quote) return { text: 'No route found', disabled: true };
    if (state.status === 'quote-ready') return { text: 'Swap', disabled: false };
    return { text: 'Swap', disabled: true };
  };

  const buttonState = getButtonState();
  const priceImpactLevel = getPriceImpactLevel(state.priceImpact);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Swap</h2>
          <SlippageSettings
            slippageBps={state.slippageBps}
            onChange={actions.setSlippage}
          />
        </div>

        {/* Input Token Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <TokenSelector
              selectedToken={state.inputToken}
              onSelect={actions.setInputToken}
              excludeMint={state.outputToken.mint}
              label="You pay"
            />
            {inputBalance && (
              <button
                type="button"
                onClick={() => actions.setInputAmount(inputBalance.uiBalance.toString())}
                className="text-xs text-gray-400 hover:text-white transition-colors self-end"
              >
                Balance: {inputBalance.uiBalance.toFixed(4)}
                <span className="ml-1 text-yellow-500">MAX</span>
              </button>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={state.inputAmount}
            onChange={(e) => actions.setInputAmount(e.target.value)}
            className={`w-full bg-transparent text-2xl font-medium outline-none
                       ${hasInsufficientBalance ? 'text-red-500' : 'text-white'}
                       placeholder-gray-500`}
          />
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            type="button"
            onClick={actions.switchTokens}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg 
                       border-4 border-gray-900 transition-colors"
            aria-label="Switch tokens"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Output Token Section */}
        <div className="bg-gray-800 rounded-xl p-4 mt-2">
          <div className="flex justify-between mb-2">
            <TokenSelector
              selectedToken={state.outputToken}
              onSelect={actions.setOutputToken}
              excludeMint={state.inputToken.mint}
              label="You receive"
            />
            {balances.balances[state.outputToken.symbol] && (
              <div className="text-xs text-gray-400 self-end">
                Balance: {balances.balances[state.outputToken.symbol].uiBalance.toFixed(4)}
              </div>
            )}
          </div>
          <div className="text-2xl font-medium text-white">
            {state.status === 'fetching-quote' ? (
              <span className="text-gray-500 animate-pulse">Loading...</span>
            ) : (
              state.outputAmount || '0.00'
            )}
          </div>
        </div>

        {/* Quote Details */}
        {state.quote && (
          <div className="mt-4 space-y-2 text-sm">
            {/* Rate */}
            <div className="flex justify-between text-gray-400">
              <span>Rate</span>
              <span>
                1 {state.inputToken.symbol} ≈{' '}
                {(
                  parseFloat(state.outputAmount.replace(/,/g, '')) /
                  parseFloat(state.inputAmount)
                ).toFixed(6)}{' '}
                {state.outputToken.symbol}
              </span>
            </div>

            {/* Price Impact */}
            <div className="flex justify-between">
              <span className="text-gray-400">Price Impact</span>
              <span
                className={
                  priceImpactLevel === 'low'
                    ? 'text-green-400'
                    : priceImpactLevel === 'medium'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }
              >
                {formatPriceImpact(state.priceImpact)}
              </span>
            </div>

            {/* Route */}
            {state.route && (
              <div className="flex justify-between text-gray-400">
                <span>Route</span>
                <span className="text-right max-w-[200px] truncate">
                  {state.route}
                </span>
              </div>
            )}

            {/* Slippage */}
            <div className="flex justify-between text-gray-400">
              <span>Max Slippage</span>
              <span>{(state.slippageBps / 100).toFixed(2)}%</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{state.error}</p>
          </div>
        )}

        {/* Success Message */}
        {state.status === 'success' && state.txSignature && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm mb-2">Swap successful!</p>
            <a
              href={`https://solscan.io/tx/${state.txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              View on Solscan →
            </a>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {!connected ? (
            <WalletMultiButton className="w-full !bg-yellow-500 hover:!bg-yellow-400 
                                          !text-black !font-bold !py-3 !rounded-xl
                                          !transition-colors" />
          ) : (
            <button
              type="button"
              onClick={actions.executeSwap}
              disabled={buttonState.disabled}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all
                         ${
                           buttonState.disabled
                             ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                             : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                         }`}
            >
              {buttonState.text}
            </button>
          )}
        </div>

        {/* Connected Wallet Address */}
        {connected && publicKey && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-xs text-gray-500">
              Connected: {publicKey.toString().slice(0, 4)}...
              {publicKey.toString().slice(-4)}
            </span>
            <WalletDisconnectButton className="!bg-red-600/20 !border !border-red-500/50 
                                               hover:!bg-red-600/40 !text-red-400 !text-xs 
                                               !py-1 !px-3 !rounded-lg !transition-colors" />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center mt-4 px-4">
        Swaps are executed on-chain via Jupiter. SNOZCOIN never has custody of your funds.
        Always verify transactions in your wallet before signing.
      </p>
    </div>
  );
};

/**
 * Slippage Settings Component
 */
const SlippageSettings: FC<{
  slippageBps: number;
  onChange: (bps: number) => void;
}> = ({ slippageBps, onChange }) => {
  const presets = [
    { label: '0.1%', value: 10 },
    { label: '0.5%', value: 50 },
    { label: '1%', value: 100 },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Slippage:</span>
      <div className="flex gap-1">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`px-2 py-1 text-xs rounded transition-colors
                       ${
                         slippageBps === preset.value
                           ? 'bg-yellow-500 text-black'
                           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SwapCard;
