/**
 * EtherMod — ethers/v5-to-v6
 *
 * Codemod recipe that automates the ethers.js v5 → v6 migration.
 * Transforms are applied in order: imports first, then API changes.
 *
 * Transforms applied:
 *  1. imports       — fix / remove obsolete import specifiers and sub-paths
 *  2. providers     — flatten ethers.providers.* → ethers.*
 *  3. flatten-utils — flatten ethers.utils.* → ethers.*
 *  4. bignumber     — ethers.BigNumber.from(x) → BigInt(x)
 */

import type { Transform, FileInfo, API } from "jscodeshift";
import importsTransform from "./transforms/imports";
import providersTransform from "./transforms/providers";
import flattenUtilsTransform from "./transforms/flatten-utils";
import bigNumberTransform from "./transforms/bignumber-to-bigint";

const transforms: Transform[] = [
  importsTransform,
  providersTransform,
  flattenUtilsTransform,
  bigNumberTransform,
];

const transform: Transform = (file: FileInfo, api: API, options) => {
  let source = file.source;

  for (const t of transforms) {
    const result = t({ ...file, source }, api, options);
    if (typeof result === "string") {
      source = result;
    }
  }

  return source === file.source ? file.source : source;
};

export default transform;
module.exports = transform;
