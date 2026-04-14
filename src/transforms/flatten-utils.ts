/**
 * Transform: ethers.utils.* → ethers.*
 *
 * ethers v6 removed the `utils` namespace. All utilities are now
 * exported directly from the ethers package.
 *
 * Examples:
 *   ethers.utils.parseEther("1.0")  →  ethers.parseEther("1.0")
 *   ethers.utils.formatEther(value) →  ethers.formatEther(value)
 *   ethers.utils.id("text")         →  ethers.id("text")
 */

import type { Transform, ASTPath, MemberExpression } from "jscodeshift";

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // ethers.utils.someMethod → ethers.someMethod
  root
    .find(j.MemberExpression, {
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "ethers" },
        property: { type: "Identifier", name: "utils" },
      },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const inner = path.node.object as MemberExpression;
      const ethersObj = inner.object;
      const property = path.node.property;

      path.replace(j.memberExpression(ethersObj, property));
      changed = true;
    });

  // const { utils } = ethers  →  remove utils destructuring (handled by import transform)
  // ethers.utils itself used standalone → ethers (edge case: leave for AI)

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
