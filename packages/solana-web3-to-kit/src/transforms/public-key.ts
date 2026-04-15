/**
 * public-key.ts
 *
 * Transforms PublicKey usages:
 *
 *   new PublicKey(str)   → address(str)
 *   PublicKey.default    → address("11111111111111111111111111111111")
 *   someKeypair.publicKey → someKeypair.address
 *
 * Injects `address` import into the @solana/kit import declaration.
 *
 * Note: We only transform `new PublicKey(...)` when `PublicKey` was imported
 * from `@solana/web3.js` (or `@solana/kit` after imports.ts ran).
 */

import type { Transform, FileInfo, API } from "jscodeshift";

const SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111";

const transform: Transform = (file: FileInfo, api: API) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirty = false;
  let needsAddressImport = false;

  // Collect identifiers imported from @solana/web3.js or @solana/kit
  const solanaLocals = new Set<string>();
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
          solanaLocals.add(
            (spec.local?.name as string) ??
              (spec.imported.type === "Identifier" ? (spec.imported.name as string) : "")
          );
        }
      });
    });

  // 1. new PublicKey(str) → address(str)
  root
    .find(j.NewExpression, {
      callee: { type: "Identifier", name: "PublicKey" },
    })
    .filter(() => solanaLocals.has("PublicKey"))
    .forEach((path) => {
      dirty = true;
      needsAddressImport = true;
      path.replace(
        j.callExpression(j.identifier("address"), path.node.arguments)
      );
    });

  // 2. PublicKey.default → address("11111111111111111111111111111111")
  root
    .find(j.MemberExpression, {
      object: { type: "Identifier", name: "PublicKey" },
      property: { type: "Identifier", name: "default" },
    })
    .filter(() => solanaLocals.has("PublicKey"))
    .forEach((path) => {
      dirty = true;
      needsAddressImport = true;
      path.replace(
        j.callExpression(j.identifier("address"), [
          j.stringLiteral(SYSTEM_PROGRAM_ADDRESS),
        ])
      );
    });

  // 3. someObj.publicKey → someObj.address
  //    (only on MemberExpression where the property is `publicKey`)
  //    We intentionally skip PublicKey.publicKey (the class itself won't have one)
  root
    .find(j.MemberExpression, {
      property: { type: "Identifier", name: "publicKey" },
    })
    .forEach((path) => {
      const obj = path.node.object;
      // Skip static references like `PublicKey.publicKey` (doesn't exist, but be safe)
      if (obj.type === "Identifier" && obj.name === "PublicKey") return;
      dirty = true;
      (path.node.property as { name: string }).name = "address";
    });

  // 4. Inject `address` import
  if (needsAddressImport) {
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
            s.imported.name === "address"
        );
        if (!already) {
          specs.push(j.importSpecifier(j.identifier("address")));
          path.node.specifiers = specs;
        }
        injected = true;
      });

    if (!injected) {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier("address"))],
        j.literal("@solana/kit")
      );
      root.find(j.Program).get("body").unshift(newImport);
    }
  }

  return dirty ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
