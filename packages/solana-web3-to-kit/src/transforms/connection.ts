/**
 * connection.ts
 *
 * Transforms:
 *   new Connection(url)              → createSolanaRpc(url)
 *   new Connection(url, commitment)  → createSolanaRpc(url)   (commitment arg dropped — v2 handles differently)
 *
 * Also injects the `createSolanaRpc` import into the `@solana/kit` import if needed.
 *
 * RPC method call transforms (adds .send()):
 *   conn.getBalance(pk)      → conn.getBalance(pk).send()
 *   conn.getAccountInfo(pk)  → conn.getAccountInfo(pk).send()
 *   conn.sendRawTransaction  → conn.sendTransaction
 *
 * Note: We only transform `new Connection(...)` when `Connection` was imported
 * from `@solana/web3.js` (or `@solana/kit` after imports.ts ran).
 */

import type { Transform, FileInfo, API } from "jscodeshift";

// RPC methods that need `.send()` appended
const RPC_METHODS = new Set([
  "getBalance",
  "getAccountInfo",
  "getLatestBlockhash",
  "getSlot",
  "getTransaction",
  "getSignatureStatuses",
  "getTokenAccountsByOwner",
  "getProgramAccounts",
  "getRecentBlockhash",
  "confirmTransaction",
  "requestAirdrop",
]);

const RENAMED_METHODS = Object.assign(
  Object.create(null) as Record<string, string>,
  {
    sendRawTransaction: "sendTransaction",
    getRecentBlockhash: "getLatestBlockhash",
  }
);

const transform: Transform = (file: FileInfo, api: API) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirty = false;

  // Collect identifiers imported from @solana/web3.js OR @solana/kit
  const solanaImports = new Set<string>();
  root
    .find(j.ImportDeclaration)
    .filter(
      (p) =>
        p.node.source.value === "@solana/web3.js" ||
        p.node.source.value === "@solana/kit"
    )
    .forEach((p) => {
      (p.node.specifiers ?? []).forEach((spec) => {
        if (spec.type === "ImportSpecifier") {
          solanaImports.add(
            (spec.local?.name as string) ??
              (spec.imported.type === "Identifier" ? (spec.imported.name as string) : "")
          );
        }
      });
    });

  // 1. Transform: new Connection(...) → createSolanaRpc(...)
  root
    .find(j.NewExpression, {
      callee: { type: "Identifier", name: "Connection" },
    })
    .filter(() => solanaImports.has("Connection"))
    .forEach((path) => {
      dirty = true;
      // Keep only the first argument (URL); drop commitment string
      const args = path.node.arguments.slice(0, 1);
      path.replace(
        j.callExpression(j.identifier("createSolanaRpc"), args)
      );
    });

  // 2. Inject `createSolanaRpc` into the @solana/kit import if needed
  if (dirty) {
    let injected = false;
    root
      .find(j.ImportDeclaration, { source: { value: "@solana/kit" } })
      .forEach((path) => {
        if (injected) return;
        const specs = path.node.specifiers ?? [];
        const already = specs.some(
          (s) =>
            s.type === "ImportSpecifier" &&
            s.imported.type === "Identifier" &&
            s.imported.name === "createSolanaRpc"
        );
        if (!already) {
          specs.push(
            j.importSpecifier(j.identifier("createSolanaRpc"))
          );
          path.node.specifiers = specs;
        }
        injected = true;
      });

    // No @solana/kit import exists yet — add one
    if (!injected) {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier("createSolanaRpc"))],
        j.literal("@solana/kit")
      );
      // Insert at top of file
      const body = root.find(j.Program).get("body");
      body.unshift(newImport);
    }
  }

  // 3. Rename deprecated RPC methods
  root.find(j.MemberExpression).forEach((path) => {
    const prop = path.node.property;
    if (prop.type !== "Identifier") return;
    if (!Object.hasOwn(RENAMED_METHODS, prop.name)) return;
    dirty = true;
    prop.name = RENAMED_METHODS[prop.name];
  });

  // 4. Append .send() to RPC method calls that don't already have it
  root.find(j.CallExpression).forEach((path) => {
    const callee = path.node.callee;
    if (callee.type !== "MemberExpression") return;
    const prop = callee.property;
    if (prop.type !== "Identifier") return;
    if (!RPC_METHODS.has(prop.name)) return;

    // Check if parent is already a .send() call
    const parent = path.parent?.node;
    if (
      parent?.type === "MemberExpression" &&
      parent.property.type === "Identifier" &&
      parent.property.name === "send"
    ) {
      return; // already wrapped
    }
    if (
      parent?.type === "CallExpression" &&
      parent.callee.type === "MemberExpression" &&
      parent.callee.property.type === "Identifier" &&
      parent.callee.property.name === "send"
    ) {
      return;
    }

    dirty = true;
    // Wrap: expr.method(args) → expr.method(args).send()
    path.replace(
      j.callExpression(
        j.memberExpression(path.node, j.identifier("send")),
        []
      )
    );
  });

  return dirty ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
