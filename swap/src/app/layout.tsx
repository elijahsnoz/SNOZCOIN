/**
 * Root Layout
 * 
 * Wraps all pages with Solana wallet providers.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '@/components/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SNOZCOIN Swap | USDT ⇄ SOL',
  description: 'Swap USDT and SOL instantly with no signup. Non-custodial, powered by Jupiter.',
  keywords: ['solana', 'swap', 'usdt', 'sol', 'jupiter', 'dex', 'crypto'],
  openGraph: {
    title: 'SNOZCOIN Swap',
    description: 'Swap USDT and SOL instantly with no signup.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
