/**
 * Transform: provider.waitForTransaction() → provider.waitForTransactionReceipt()
 *
 * ethers v6 renamed waitForTransaction to waitForTransactionReceipt.
 *
 * Examples:
 *   provider.waitForTransaction(hash)         →  provider.waitForTransactionReceipt(hash)
 *   provider.waitForTransaction(hash, 1)      →  provider.waitForTransactionReceipt(hash, 1)
 *   await provider.waitForTransaction(hash)   →  await provider.waitForTransactionReceipt(hash)
 */

import type { Transform, ASTPath, MemberExpression } from "jscodeshift";

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root
    .find(j.MemberExpression, {
      property: { type: "Identifier", name: "waitForTransaction" },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      path.node.property = j.identifier("waitForTransactionReceipt");
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
