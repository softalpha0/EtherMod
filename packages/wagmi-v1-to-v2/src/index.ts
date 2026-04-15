/**
 * EtherMod — wagmi/v1-to-v2
 *
 * Codemod recipe that automates the wagmi v1 → v2 migration.
 *
 * Transforms applied:
 *  1. imports  — remove configureChains/provider imports, rename WagmiConfig/createClient
 *  2. hooks    — rename all v1 hooks to v2 equivalents
 *  3. jsx      — rename JSX components (<WagmiConfig> → <WagmiProvider>)
 */

import type { Transform, FileInfo, API } from "jscodeshift";
import importsTransform from "./transforms/imports";
import hooksTransform from "./transforms/hooks";
import jsxTransform from "./transforms/jsx";

const transforms: Transform[] = [
  importsTransform,
  hooksTransform,
  jsxTransform,
];

const transform: Transform = (file: FileInfo, api: API, options) => {
  let source = file.source;
  for (const t of transforms) {
    const result = t({ ...file, source }, api, options);
    if (typeof result === "string") source = result;
  }
  return source === file.source ? file.source : source;
};

export default transform;
module.exports = transform;
