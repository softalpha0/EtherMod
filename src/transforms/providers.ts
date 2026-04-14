/**
 * Transform: providers namespace changes
 *
 * ethers v6 flattened the `providers` namespace.
 *
 * Examples:
 *   new ethers.providers.JsonRpcProvider(url)  →  new ethers.JsonRpcProvider(url)
 *   new ethers.providers.WebSocketProvider(url) →  new ethers.WebSocketProvider(url)
 *   new ethers.providers.AlchemyProvider(...)  →  new ethers.AlchemyProvider(...)
 *   new ethers.providers.InfuraProvider(...)   →  new ethers.InfuraProvider(...)
 *   new ethers.providers.Web3Provider(...)     →  new ethers.BrowserProvider(...)
 *   ethers.providers.JsonRpcProvider           →  ethers.JsonRpcProvider  (type refs)
 */

import type { Transform, ASTPath, MemberExpression, NewExpression, TSQualifiedName } from "jscodeshift";

// Web3Provider was renamed to BrowserProvider in v6
const RENAMED: Record<string, string> = {
  Web3Provider: "BrowserProvider",
};

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // new ethers.providers.XxxProvider(...)  →  new ethers.XxxProvider(...)
  root
    .find(j.NewExpression, {
      callee: {
        type: "MemberExpression",
        object: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "ethers" },
          property: { type: "Identifier", name: "providers" },
        },
      },
    })
    .forEach((path: ASTPath<NewExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const providerName = (callee.property as { name: string }).name;
      const finalName = RENAMED[providerName] ?? providerName;

      path.node.callee = j.memberExpression(
        j.identifier("ethers"),
        j.identifier(finalName)
      );
      changed = true;
    });

  // ethers.providers.XxxProvider used as expression (type refs, assignments)
  root
    .find(j.MemberExpression, {
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "ethers" },
        property: { type: "Identifier", name: "providers" },
      },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const providerName = (path.node.property as { name: string }).name;
      const finalName = RENAMED[providerName] ?? providerName;

      path.replace(
        j.memberExpression(j.identifier("ethers"), j.identifier(finalName))
      );
      changed = true;
    });

  // TypeScript type references: ethers.providers.JsonRpcProvider (TSQualifiedName)
  // TSQualifiedName represents qualified names in type positions: left.right
  // ethers.providers.JsonRpcProvider → left = ethers.providers, right = JsonRpcProvider
  root
    .find(j.TSQualifiedName, {
      left: {
        type: "TSQualifiedName",
        left: { type: "Identifier", name: "ethers" },
        right: { type: "Identifier", name: "providers" },
      },
    })
    .forEach((path: ASTPath<TSQualifiedName>) => {
      const providerName = (path.node.right as { name: string }).name;
      const finalName = RENAMED[providerName] ?? providerName;

      path.replace(
        j.tsQualifiedName(j.identifier("ethers"), j.identifier(finalName))
      );
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
