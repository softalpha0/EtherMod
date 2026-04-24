import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EtherMod — Web3 Migration Playground",
  description: "Automated codemods for ethers.js v5→v6, wagmi v1→v2, and @solana/web3.js→@solana/kit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
