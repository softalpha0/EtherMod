/**
 * Transform: ethers.constants.* → ethers.* (v6 renamed constants)
 *
 * ethers v6 removed the `constants` namespace. Constants are now
 * exported directly with new names.
 *
 * Examples:
 *   ethers.constants.AddressZero  →  ethers.ZeroAddress
 *   ethers.constants.HashZero     →  ethers.ZeroHash
 *   ethers.constants.MaxUint256   →  ethers.MaxUint256
 *   ethers.constants.WeiPerEther  →  ethers.WeiPerEther
 *   ethers.constants.EtherSymbol  →  ethers.EtherSymbol
 *   ethers.constants.NegativeOne  →  BigInt(-1)
 *   ethers.constants.Zero         →  BigInt(0)
 *   ethers.constants.One          →  BigInt(1)
 *   ethers.constants.Two          →  BigInt(2)
 */

import type { Transform, ASTPath, MemberExpression } from "jscodeshift";

// Use null-prototype to prevent prototype chain lookups (e.g. "constructor", "toString")
const RENAMED = Object.assign(Object.create(null) as Record<string, string>, {
  AddressZero: "ZeroAddress",
  HashZero: "ZeroHash",
  MaxUint256: "MaxUint256",
  MaxInt256: "MaxInt256",
  MinInt256: "MinInt256",
  WeiPerEther: "WeiPerEther",
  EtherSymbol: "EtherSymbol",
});

// Numeric constants → BigInt literals (null-prototype for same safety)
const BIGINT = Object.assign(Object.create(null) as Record<string, string>, {
  NegativeOne: "-1",
  Zero: "0",
  One: "1",
  Two: "2",
});

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root
    .find(j.MemberExpression, {
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "ethers" },
        property: { type: "Identifier", name: "constants" },
      },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const constName = (path.node.property as { name: string }).name;

      if (RENAMED[constName]) {
        path.replace(
          j.memberExpression(
            j.identifier("ethers"),
            j.identifier(RENAMED[constName])
          )
        );
        changed = true;
      } else if (BIGINT[constName]) {
        path.replace(
          j.callExpression(j.identifier("BigInt"), [
            j.stringLiteral(BIGINT[constName]),
          ])
        );
        changed = true;
      }
    });

  // Also handle: const { constants } = ethers → handled by imports transform
  // Also handle directly destructured: constants.AddressZero
  root
    .find(j.MemberExpression, {
      object: { type: "Identifier", name: "constants" },
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const constName = (path.node.property as { name: string }).name;
      // Only transform if it looks like an ethers constant
      if (RENAMED[constName]) {
        path.replace(
          j.memberExpression(
            j.identifier("ethers"),
            j.identifier(RENAMED[constName])
          )
        );
        changed = true;
      } else if (BIGINT[constName]) {
        path.replace(
          j.callExpression(j.identifier("BigInt"), [
            j.stringLiteral(BIGINT[constName]),
          ])
        );
        changed = true;
      }
    });

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
