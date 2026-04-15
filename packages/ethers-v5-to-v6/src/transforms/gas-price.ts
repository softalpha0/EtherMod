/**
 * Transform: provider.getGasPrice() → (await provider.getFeeData()).gasPrice
 *
 * ethers v6 removed getGasPrice() in favour of getFeeData() which
 * returns an object with gasPrice, maxFeePerGas, maxPriorityFeePerGas.
 *
 * Examples:
 *   await provider.getGasPrice()         →  (await provider.getFeeData()).gasPrice
 *   const gp = await signer.getGasPrice() →  const gp = (await signer.getFeeData()).gasPrice
 */

import type { Transform, ASTPath, AwaitExpression, CallExpression } from "jscodeshift";

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // await provider.getGasPrice()  →  (await provider.getFeeData()).gasPrice
  root
    .find(j.AwaitExpression, {
      argument: {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "getGasPrice" },
        },
      },
    })
    .forEach((path: ASTPath<AwaitExpression>) => {
      const call = path.node.argument as CallExpression;
      const callee = call.callee as { object: unknown };

      // Build: (await provider.getFeeData()).gasPrice
      const newAwait = j.awaitExpression(
        j.callExpression(
          j.memberExpression(
            callee.object as Parameters<typeof j.memberExpression>[0],
            j.identifier("getFeeData")
          ),
          []
        )
      );

      path.replace(
        j.memberExpression(
          j.parenthesizedExpression
            ? j.parenthesizedExpression(newAwait)
            : newAwait,
          j.identifier("gasPrice")
        )
      );
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
