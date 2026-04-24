import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

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

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Import source rewrites
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
    rootNode.findAll(`"${subPath}"`).forEach((node) => {
      edits.push(node.replace('"ethers"'));
    });
    rootNode.findAll(`'${subPath}'`).forEach((node) => {
      edits.push(node.replace('"ethers"'));
    });
  }

  // 2. ethers.BigNumber.from($ARG) → BigInt($ARG)
  rootNode.findAll("ethers.BigNumber.from($ARG)").forEach((node) => {
    const arg = node.getMatch("ARG")?.text() ?? "";
    edits.push(node.replace(`BigInt(${arg})`));
  });

  // 3. BigNumber.from($ARG) → BigInt($ARG)
  rootNode.findAll("BigNumber.from($ARG)").forEach((node) => {
    const arg = node.getMatch("ARG")?.text() ?? "";
    edits.push(node.replace(`BigInt(${arg})`));
  });

  // 4. ethers.utils.$UTIL → ethers.$UTIL
  rootNode.findAll("ethers.utils.$UTIL").forEach((node) => {
    const util = node.getMatch("UTIL")?.text();
    if (util) edits.push(node.replace(`ethers.${util}`));
  });

  // 5. ethers.providers.$PROVIDER → ethers.$PROVIDER
  rootNode.findAll("ethers.providers.$PROVIDER").forEach((node) => {
    const provider = node.getMatch("PROVIDER")?.text();
    if (!provider) return;
    edits.push(node.replace(provider === "Web3Provider" ? "ethers.BrowserProvider" : `ethers.${provider}`));
  });

  // 6. ethers.constants.$CONST → renamed value
  rootNode.findAll("ethers.constants.$CONST").forEach((node) => {
    const name = node.getMatch("CONST")?.text();
    if (name && CONSTANT_RENAMES[name]) edits.push(node.replace(CONSTANT_RENAMES[name]));
  });

  // 7. provider.getGasPrice() → (await provider.getFeeData()).gasPrice
  rootNode.findAll("$PROVIDER.getGasPrice()").forEach((node) => {
    const provider = node.getMatch("PROVIDER")?.text();
    if (provider) edits.push(node.replace(`(await ${provider}.getFeeData()).gasPrice`));
  });

  // 8. waitForTransaction → waitForTransactionReceipt
  rootNode.findAll("waitForTransaction").forEach((node) => {
    edits.push(node.replace("waitForTransactionReceipt"));
  });

  // 9. formatBytes32String / parseBytes32String
  rootNode.findAll("formatBytes32String").forEach((node) => {
    edits.push(node.replace("encodeBytes32String"));
  });
  rootNode.findAll("parseBytes32String").forEach((node) => {
    edits.push(node.replace("decodeBytes32String"));
  });

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
