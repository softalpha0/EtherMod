/**
 * Transform: wagmi v1 → v2 JSX component renames
 *
 * Examples:
 *   <WagmiConfig config={config}>  →  <WagmiProvider config={config}>
 */

import type { Transform, ASTPath, JSXIdentifier } from "jscodeshift";

const JSX_RENAMES = Object.assign(Object.create(null) as Record<string, string>, {
  WagmiConfig: "WagmiProvider",
});

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // Opening tags
  root.find(j.JSXIdentifier).forEach((path: ASTPath<JSXIdentifier>) => {
    if (Object.hasOwn(JSX_RENAMES, path.node.name)) {
      path.node.name = JSX_RENAMES[path.node.name];
      changed = true;
    }
  });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
