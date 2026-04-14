/**
 * Transform: BigNumber → native bigint
 *
 * ethers v6 dropped BigNumber in favour of native JS bigint.
 *
 * Examples:
 *   ethers.BigNumber.from("100")  →  BigInt("100")
 *   ethers.BigNumber.from(100)    →  BigInt(100)
 *   value.toBigNumber()           →  (leave for AI — no safe deterministic rule)
 *   value.toNumber()              →  Number(value)   (when value is a BigNumber)
 *   BigNumber.from(x).add(y)      →  (BigInt(x) + BigInt(y))  — leave for AI (complex)
 *
 * Safe deterministic rule:
 *   ethers.BigNumber.from(x)  →  BigInt(x)
 *
 * Note: import { BigNumber } from "ethers" is handled by the imports transform.
 */

import type { Transform, ASTPath, CallExpression, MemberExpression } from "jscodeshift";

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // ethers.BigNumber.from(x)  →  BigInt(x)
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
      path.replace(
        j.callExpression(j.identifier("BigInt"), path.node.arguments)
      );
      changed = true;
    });

  // BigNumber.from(x)  →  BigInt(x)   (when imported directly)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "BigNumber" },
        property: { type: "Identifier", name: "from" },
      },
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.replace(
        j.callExpression(j.identifier("BigInt"), path.node.arguments)
      );
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
