import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

// ─── Rename maps ──────────────────────────────────────────────────────────────

const CONSTANT_RENAMES: Record<string, string> = {
  AddressZero: "ethers.ZeroAddress",
  HashZero: "ethers.ZeroHash",
  MaxUint256: "ethers.MaxUint256",
  WeiPerEther: "ethers.WeiPerEther",
  EtherSymbol: "ethers.EtherSymbol",
  NegativeOne: "BigInt(-1)",
  Zero: "BigInt(0)",
  One: "BigInt(1)",
  Two: "BigInt(2)",
};

const BYTES32_RENAMES: Record<string, string> = {
  formatBytes32String: "encodeBytes32String",
  parseBytes32String: "decodeBytes32String",
};

// ─── Transform ────────────────────────────────────────────────────────────────

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Import source rewrites: ethers/lib/* → ethers
  const subPaths = [
    "ethers/lib/utils",
    "ethers/lib/providers",
    "ethers/lib/ethers",
    "ethers/lib/index",
    "@ethersproject/providers",
    "@ethersproject/units",
    "@ethersproject/bignumber",
    "@ethersproject/address",
    "@ethersproject/contracts",
    "@ethersproject/wallet",
  ];
  for (const subPath of subPaths) {
    rootNode
      .findAll({ rule: { kind: "string", regex: `^["']${subPath}["']$` } })
      .forEach((node) => {
        edits.push(node.replace('"ethers"'));
      });
  }

  // 2. BigNumber.from($ARG) → BigInt($ARG)  (not chained)
  rootNode
    .findAll({ pattern: "BigNumber.from($ARG)" })
    .forEach((node) => {
      const arg = node.getMatch("ARG")?.text() ?? "";
      edits.push(node.replace(`BigInt(${arg})`));
    });

  rootNode
    .findAll({ pattern: "ethers.BigNumber.from($ARG)" })
    .forEach((node) => {
      const arg = node.getMatch("ARG")?.text() ?? "";
      edits.push(node.replace(`BigInt(${arg})`));
    });

  // 3. ethers.utils.$UTIL → ethers.$UTIL
  rootNode
    .findAll({ pattern: "ethers.utils.$UTIL" })
    .forEach((node) => {
      const util = node.getMatch("UTIL")?.text();
      if (util) {
        edits.push(node.replace(`ethers.${util}`));
      }
    });

  // 4. ethers.providers.$PROVIDER → ethers.$PROVIDER
  //    Special case: Web3Provider → BrowserProvider
  rootNode
    .findAll({ pattern: "ethers.providers.$PROVIDER" })
    .forEach((node) => {
      const provider = node.getMatch("PROVIDER")?.text();
      if (!provider) return;
      if (provider === "Web3Provider") {
        edits.push(node.replace("ethers.BrowserProvider"));
      } else {
        edits.push(node.replace(`ethers.${provider}`));
      }
    });

  // 5. ethers.constants.$CONST → renamed value
  rootNode
    .findAll({ pattern: "ethers.constants.$CONST" })
    .forEach((node) => {
      const name = node.getMatch("CONST")?.text();
      if (name && CONSTANT_RENAMES[name]) {
        edits.push(node.replace(CONSTANT_RENAMES[name]));
      }
    });

  // 6. provider.getGasPrice() → (await provider.getFeeData()).gasPrice
  rootNode
    .findAll({ pattern: "$PROVIDER.getGasPrice()" })
    .forEach((node) => {
      const provider = node.getMatch("PROVIDER")?.text();
      if (provider) {
        edits.push(
          node.replace(`(await ${provider}.getFeeData()).gasPrice`)
        );
      }
    });

  // 7. waitForTransaction → waitForTransactionReceipt
  rootNode
    .findAll({ rule: { kind: "identifier", regex: "^waitForTransaction$" } })
    .forEach((node) => {
      edits.push(node.replace("waitForTransactionReceipt"));
    });

  // 8. formatBytes32String / parseBytes32String renames
  for (const [oldName, newName] of Object.entries(BYTES32_RENAMES)) {
    rootNode
      .findAll({ rule: { kind: "identifier", regex: `^${oldName}$` } })
      .forEach((node) => {
        edits.push(node.replace(newName));
      });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
