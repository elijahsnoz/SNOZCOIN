/**
 * Token Selector Component
 * 
 * Dropdown for selecting input/output tokens.
 */

'use client';

import { FC, useState } from 'react';
import { TokenInfo, SUPPORTED_TOKENS } from '@/lib/tokens';

interface Props {
  selectedToken: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  excludeMint?: string; // Prevent selecting same token for both sides
  label: string;
}

export const TokenSelector: FC<Props> = ({
  selectedToken,
  onSelect,
  excludeMint,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableTokens = Object.values(SUPPORTED_TOKENS).filter(
    (token) => token.mint !== excludeMint
  );

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 
                   rounded-lg px-3 py-2 transition-colors w-full"
      >
        <img
          src={selectedToken.logoURI}
          alt={selectedToken.symbol}
          className="w-6 h-6 rounded-full bg-gray-600"
        />
        <span className="font-medium">{selectedToken.symbol}</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 
                          rounded-lg shadow-lg z-20 overflow-hidden">
            {availableTokens.map((token) => (
              <button
                key={token.mint}
                type="button"
                onClick={() => {
                  onSelect(token);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 
                           hover:bg-gray-700 transition-colors
                           ${token.mint === selectedToken.mint ? 'bg-gray-700' : ''}`}
              >
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full bg-gray-600"
                />
                <div className="text-left">
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-400">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
