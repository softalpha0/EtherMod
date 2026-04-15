/**
 * EtherMod — ethers/v5-to-v6
 *
 * Codemod recipe that automates the ethers.js v5 → v6 migration.
 * Transforms are applied in order: imports first, then API changes.
 *
 * Transforms applied:
 *  1. imports            — fix / remove obsolete import specifiers and sub-paths
 *  2. providers          — flatten ethers.providers.* → ethers.*
 *  3. flatten-utils      — flatten ethers.utils.* → ethers.*
 *  4. bignumber          — ethers.BigNumber.from(x) → BigInt(x)
 *  5. constants          — ethers.constants.* → ethers.* / BigInt()
 *  6. gas-price          — provider.getGasPrice() → provider.getFeeData().gasPrice
 *  7. wait-for-tx        — waitForTransaction → waitForTransactionReceipt
 *  8. bytes32-string     — formatBytes32String → encodeBytes32String etc.
 */

import type { Transform, FileInfo, API } from "jscodeshift";
import importsTransform from "./transforms/imports";
import providersTransform from "./transforms/providers";
import flattenUtilsTransform from "./transforms/flatten-utils";
import bigNumberTransform from "./transforms/bignumber-to-bigint";
import constantsTransform from "./transforms/constants";
import gasPriceTransform from "./transforms/gas-price";
import waitForTxTransform from "./transforms/wait-for-transaction";
import bytes32Transform from "./transforms/bytes32-string";

const transforms: Transform[] = [
  importsTransform,
  providersTransform,
  flattenUtilsTransform,
  bigNumberTransform,
  constantsTransform,
  gasPriceTransform,
  waitForTxTransform,
  bytes32Transform,
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
