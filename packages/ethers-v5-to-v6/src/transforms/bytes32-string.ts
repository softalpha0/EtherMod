/**
 * Transform: formatBytes32String/parseBytes32String → v6 names
 *
 * ethers v6 renamed these utilities:
 *   ethers.utils.formatBytes32String(str)  →  ethers.encodeBytes32String(str)
 *   ethers.utils.parseBytes32String(bytes) →  ethers.decodeBytes32String(bytes)
 *
 * Note: the flatten-utils transform handles ethers.utils.* → ethers.*
 * so this transform only needs to handle the final rename after flattening.
 *
 * Safe strategy: ONLY rename when accessed as ethers.formatBytes32String
 * or as a named import usage (tracked via import specifier names in file).
 * Never match bare identifiers blindly — avoids prototype pollution false positives.
 */

import type { Transform, ASTPath, MemberExpression } from "jscodeshift";

// Use null-prototype object to prevent prototype chain lookups (e.g. "constructor")
const RENAMED = Object.assign(Object.create(null) as Record<string, string>, {
  formatBytes32String: "encodeBytes32String",
  parseBytes32String: "decodeBytes32String",
});

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // 1. ethers.formatBytes32String / ethers.parseBytes32String (member on ethers)
  root
    .find(j.MemberExpression, {
      object: { type: "Identifier", name: "ethers" },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const propName = (path.node.property as { name?: string }).name;
      if (propName && Object.hasOwn(RENAMED, propName)) {
        path.node.property = j.identifier(RENAMED[propName]);
        changed = true;
      }
    });

  // 2. Named import usages — only rename identifiers that were imported from ethers
  //    e.g. import { formatBytes32String } from "ethers"
  //    Collect which names were imported, then safely rename only those.
  const importedNames = new Set<string>();

  root.find(j.ImportDeclaration, { source: { value: "ethers" } }).forEach((path) => {
    (path.node.specifiers ?? []).forEach((spec) => {
      if (
        spec.type === "ImportSpecifier" &&
        Object.hasOwn(RENAMED, (spec.imported as { name: string }).name)
      ) {
        importedNames.add((spec.imported as { name: string }).name);
        // Also rename the import specifier itself
        (spec.imported as { name: string }).name = RENAMED[(spec.imported as { name: string }).name];
        if (spec.local) {
          (spec.local as { name: string }).name = RENAMED[(spec.local as { name: string }).name] ?? (spec.local as { name: string }).name;
        }
        changed = true;
      }
    });
  });

  // Rename usages of directly imported names (only the ones we know are from ethers)
  if (importedNames.size > 0) {
    root.find(j.Identifier).forEach((path) => {
      if (
        importedNames.has(path.node.name) &&
        path.parent?.node?.type !== "MemberExpression" &&
        path.parent?.node?.type !== "ImportSpecifier"
      ) {
        path.node.name = RENAMED[path.node.name];
        changed = true;
      }
    });
  }

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
