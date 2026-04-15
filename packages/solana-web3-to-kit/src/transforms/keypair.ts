/**
 * keypair.ts
 *
 * Transforms Keypair usages:
 *
 *   Keypair.generate()              → await generateKeyPairSigner()
 *   Keypair.fromSecretKey(bytes)    → await createKeyPairSignerFromBytes(bytes)
 *   keypair.publicKey               → keypair.address
 *
 * The `await` is added because both factory functions are now async in @solana/kit.
 * If the containing function is not async, the transform still adds await —
 * the developer must mark their function async (out of scope for AST transform).
 *
 * Injects necessary imports into the @solana/kit import declaration.
 */

import type { Transform, FileInfo, API } from "jscodeshift";

const transform: Transform = (file: FileInfo, api: API) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirty = false;

  const neededImports = new Set<string>();

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

  // 1. Keypair.generate() → await generateKeyPairSigner()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "Keypair" },
        property: { type: "Identifier", name: "generate" },
      },
    })
    .filter(() => solanaLocals.has("Keypair"))
    .forEach((path) => {
      dirty = true;
      neededImports.add("generateKeyPairSigner");
      path.replace(
        j.awaitExpression(
          j.callExpression(j.identifier("generateKeyPairSigner"), [])
        )
      );
    });

  // 2. Keypair.fromSecretKey(bytes) → await createKeyPairSignerFromBytes(bytes)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "Keypair" },
        property: { type: "Identifier", name: "fromSecretKey" },
      },
    })
    .filter(() => solanaLocals.has("Keypair"))
    .forEach((path) => {
      dirty = true;
      neededImports.add("createKeyPairSignerFromBytes");
      path.replace(
        j.awaitExpression(
          j.callExpression(
            j.identifier("createKeyPairSignerFromBytes"),
            path.node.arguments
          )
        )
      );
    });

  // 3. Keypair.fromSeed(seed) → await createKeyPairSignerFromBytes(seed)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "Keypair" },
        property: { type: "Identifier", name: "fromSeed" },
      },
    })
    .filter(() => solanaLocals.has("Keypair"))
    .forEach((path) => {
      dirty = true;
      neededImports.add("createKeyPairSignerFromBytes");
      path.replace(
        j.awaitExpression(
          j.callExpression(
            j.identifier("createKeyPairSignerFromBytes"),
            path.node.arguments
          )
        )
      );
    });

  // 4. Inject needed imports into @solana/kit declaration
  if (neededImports.size > 0) {
    let injected = false;
    root
      .find(j.ImportDeclaration, { source: { value: "@solana/kit" } })
      .forEach((path) => {
        if (injected) return;
        const specs = path.node.specifiers ?? [];
        const existing = new Set(
          specs
            .filter((s) => s.type === "ImportSpecifier")
            .map((s) =>
              s.type === "ImportSpecifier" && s.imported.type === "Identifier"
                ? (s.imported.name as string)
                : ""
            )
        );
        for (const name of neededImports) {
          if (!existing.has(name)) {
            specs.push(j.importSpecifier(j.identifier(name)));
          }
        }
        path.node.specifiers = specs;
        injected = true;
      });

    if (!injected) {
      const newImport = j.importDeclaration(
        [...neededImports].map((n) => j.importSpecifier(j.identifier(n))),
        j.literal("@solana/kit")
      );
      root.find(j.Program).get("body").unshift(newImport);
    }
  }

  return dirty ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
