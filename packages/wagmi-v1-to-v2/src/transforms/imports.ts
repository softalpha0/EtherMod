/**
 * Transform: wagmi v1 → v2 import changes
 *
 * - configureChains removed → removed from imports (use createConfig)
 * - WagmiConfig renamed → WagmiProvider
 * - createClient renamed → createConfig
 * - Sub-path imports consolidated
 *
 * Examples:
 *   import { configureChains, createClient, WagmiConfig } from 'wagmi'
 *   → import { createConfig, WagmiProvider } from 'wagmi'
 *
 *   import { mainnet } from 'wagmi/chains'  → unchanged (still valid)
 *   import { publicProvider } from 'wagmi/providers/public'  → removed (use http())
 *   import { jsonRpcProvider } from 'wagmi/providers/jsonRpc' → removed (use http())
 */

import type { Transform, ASTPath, ImportDeclaration } from "jscodeshift";

const RENAMED = Object.assign(Object.create(null) as Record<string, string>, {
  WagmiConfig: "WagmiProvider",
  createClient: "createConfig",
});

const REMOVED = new Set([
  "configureChains",
  "createStorage",
]);

const REMOVED_SOURCES = new Set([
  "wagmi/providers/public",
  "wagmi/providers/jsonRpc",
  "wagmi/providers/alchemy",
  "wagmi/providers/infura",
]);

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root.find(j.ImportDeclaration).forEach((path: ASTPath<ImportDeclaration>) => {
    const src = path.node.source.value as string;

    // Remove provider sub-path imports entirely
    if (REMOVED_SOURCES.has(src)) {
      path.prune();
      changed = true;
      return;
    }

    if (src !== "wagmi") return;

    const specifiers = path.node.specifiers ?? [];
    const kept = specifiers.filter((spec) => {
      if (spec.type !== "ImportSpecifier") return true;
      const name = (spec.imported as { name: string }).name;
      if (REMOVED.has(name)) {
        changed = true;
        return false;
      }
      return true;
    });

    // Rename kept specifiers
    kept.forEach((spec) => {
      if (spec.type !== "ImportSpecifier") return;
      const name = (spec.imported as { name: string }).name;
      if (Object.hasOwn(RENAMED, name)) {
        (spec.imported as { name: string }).name = RENAMED[name];
        (spec.local as { name: string }).name = RENAMED[name];
        changed = true;
      }
    });

    if (kept.length === 0) {
      path.prune();
    } else {
      path.node.specifiers = kept;
    }
  });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
