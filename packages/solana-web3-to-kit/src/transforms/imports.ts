/**
 * imports.ts
 *
 * Renames `@solana/web3.js` → `@solana/kit` in all import declarations.
 * Also rewrites named imports that have been renamed in @solana/kit:
 *
 *   Connection         (removed — handled by connection.ts transform)
 *   Keypair            (removed — handled by keypair.ts transform)
 *   PublicKey          (removed — handled by public-key.ts transform)
 *   sendAndConfirmTransaction → sendAndConfirmTransactionFactory (stub rename)
 *   Transaction        → removed (legacy, no direct replacement — left for human)
 *
 * Named imports that map 1-to-1 are added to the same kit import.
 */

import type { Transform, FileInfo, API } from "jscodeshift";

// Named imports in web3.js that are removed/replaced in @solana/kit.
// Keys = old name, value = new name | null (null = drop the specifier).
const IMPORT_RENAMES = Object.assign(
  Object.create(null) as Record<string, string | null>,
  {
    // Handled by dedicated transforms — strip from import (the transform re-adds as needed)
    Connection: null,
    Keypair: null,
    PublicKey: null,

    // Direct renames that are safe to do unconditionally
    sendAndConfirmTransaction: "sendAndConfirmTransactionFactory",
    clusterApiUrl: "getDefaultSolanaRpcTransport",
    LAMPORTS_PER_SOL: "LAMPORTS_PER_SOL", // same name, still exists
    SystemProgram: "SystemProgram", // same name
    Transaction: null, // Legacy Transaction removed; leave for human review
    TransactionInstruction: null, // same — leave for human
  }
);

const transform: Transform = (file: FileInfo, api: API) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirty = false;

  root
    .find(j.ImportDeclaration, {
      source: { value: "@solana/web3.js" },
    })
    .forEach((path) => {
      dirty = true;

      // Rename the package
      path.node.source.value = "@solana/kit";

      // Rewrite specifiers
      const kept: typeof path.node.specifiers = [];
      for (const spec of path.node.specifiers ?? []) {
        if (spec.type !== "ImportSpecifier") {
          // namespace / default imports — keep as-is
          kept.push(spec);
          continue;
        }

        const oldName =
          spec.imported.type === "Identifier"
            ? spec.imported.name
            : (spec.imported as { value?: string }).value ?? "";

        if (!Object.hasOwn(IMPORT_RENAMES, oldName)) {
          // Not in our rename map → keep unchanged
          kept.push(spec);
          continue;
        }

        const newName = IMPORT_RENAMES[oldName];
        if (newName === null) {
          // Drop this specifier — dedicated transform handles it
          continue;
        }

        if (newName === oldName) {
          // Same name → keep
          kept.push(spec);
        } else {
          // Rename the imported identifier
          const localName =
            (spec.local?.name as string) !== oldName ? (spec.local?.name as string) : newName;
          kept.push(
            j.importSpecifier(
              j.identifier(newName),
              j.identifier(localName ?? newName)
            )
          );
        }
      }

      if (kept.length === 0) {
        // All specifiers were removed — drop the whole declaration
        path.prune();
      } else {
        path.node.specifiers = kept;
      }
    });

  return dirty ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
