/**
 * EtherMod — solana-web3-to-kit
 *
 * Codemod recipe that automates the @solana/web3.js v1 → @solana/kit migration.
 * Transforms are applied in order: imports first, then API changes.
 *
 * Transforms applied:
 *  1. imports     — rename @solana/web3.js → @solana/kit, clean specifiers
 *  2. connection  — new Connection(url) → createSolanaRpc(url), add .send()
 *  3. keypair     — Keypair.generate() → await generateKeyPairSigner()
 *  4. public-key  — new PublicKey(str) → address(str), .publicKey → .address
 */

import type { Transform, FileInfo, API } from "jscodeshift";
import importsTransform from "./transforms/imports";
import connectionTransform from "./transforms/connection";
import keypairTransform from "./transforms/keypair";
import publicKeyTransform from "./transforms/public-key";

const transforms: Transform[] = [
  importsTransform,
  connectionTransform,
  keypairTransform,
  publicKeyTransform,
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
