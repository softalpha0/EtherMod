/**
 * Transform: Fix ethers v5 imports for v6
 *
 * Changes:
 *   import { ethers } from "ethers"              → unchanged (fine in v6)
 *   import { BigNumber } from "ethers"           → remove (use native bigint)
 *   import { providers } from "ethers"           → remove (providers is gone)
 *   import { utils } from "ethers"               → remove (utils is gone)
 *   import { ... } from "ethers/lib/utils"       → import { ... } from "ethers"
 *   import { ... } from "ethers/lib/ethers"      → import { ... } from "ethers"
 *   import { ethers } from "@ethersproject/..."  → import { ethers } from "ethers"
 *
 * Removed namespace specifiers that are now top-level:
 *   providers, utils, BigNumber, constants, errors, logger, wordlists
 */

import type { Transform, ImportDeclaration, ASTPath } from "jscodeshift";

// Sub-path imports that should point to the root "ethers" package in v6
const SUBPATH_PATTERNS = [
  /^ethers\/lib\//,
  /^@ethersproject\//,
];

// Named imports that no longer exist as such in v6 (namespaces / classes removed)
const REMOVED_NAMESPACE_IMPORTS = new Set([
  "providers",
  "utils",
  "BigNumber",
  "constants",
  "errors",
  "logger",
  "wordlists",
]);

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root.find(j.ImportDeclaration).forEach((path: ASTPath<ImportDeclaration>) => {
    const source = path.node.source.value as string;

    // Fix sub-path imports → "ethers"
    if (SUBPATH_PATTERNS.some((re) => re.test(source))) {
      path.node.source = j.stringLiteral("ethers");
      changed = true;
    }

    // Remove specifiers for deleted namespaces (BigNumber, utils, providers…)
    if (path.node.specifiers && source === "ethers") {
      const before = path.node.specifiers.length;
      path.node.specifiers = path.node.specifiers.filter((spec) => {
        if (spec.type !== "ImportSpecifier") return true;
        const imported = (spec.imported as { name: string }).name;
        return !REMOVED_NAMESPACE_IMPORTS.has(imported);
      });
      if (path.node.specifiers.length !== before) changed = true;

      // Remove the entire import declaration if it's now empty
      if (path.node.specifiers.length === 0) {
        path.prune();
      }
    }
  });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
