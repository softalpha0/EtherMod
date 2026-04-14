/**
 * Transform: BigNumber → native bigint
 *
 * ethers v6 dropped BigNumber in favour of native JS bigint.
 *
 * Safe deterministic rule:
 *   ethers.BigNumber.from(x)  →  BigInt(x)   ONLY when NOT chained
 *   BigNumber.from(x)         →  BigInt(x)   ONLY when NOT chained
 *
 * Chained calls like BigNumber.from(2).pow(128).sub(1) are LEFT for AI
 * because native bigint has no .pow() / .sub() / .mul() / .add() methods.
 *
 * Note: import { BigNumber } from "ethers" is handled by the imports transform.
 */

import type { Transform, ASTPath, CallExpression } from "jscodeshift";

/** Returns true if the CallExpression result is immediately chained (.method()) */
function isChained(path: ASTPath<CallExpression>): boolean {
  const parent = path.parent?.node;
  // Parent is a MemberExpression whose object is our node → chained call
  return (
    parent?.type === "MemberExpression" &&
    parent.object === path.node
  );
}

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // ethers.BigNumber.from(x)  →  BigInt(x)  (skip chained)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "ethers" },
          property: { type: "Identifier", name: "BigNumber" },
        },
        property: { type: "Identifier", name: "from" },
      },
    })
    .forEach((path: ASTPath<CallExpression>) => {
      if (isChained(path)) return; // leave for AI
      path.replace(
        j.callExpression(j.identifier("BigInt"), path.node.arguments)
      );
      changed = true;
    });

  // BigNumber.from(x)  →  BigInt(x)  (skip chained)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "BigNumber" },
        property: { type: "Identifier", name: "from" },
      },
    })
    .forEach((path: ASTPath<CallExpression>) => {
      if (isChained(path)) return; // leave for AI
      path.replace(
        j.callExpression(j.identifier("BigInt"), path.node.arguments)
      );
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
