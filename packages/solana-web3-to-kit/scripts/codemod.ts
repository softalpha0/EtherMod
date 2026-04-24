import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

const RPC_METHODS = [
  "getBalance",
  "getAccountInfo",
  "getLatestBlockhash",
  "getSlot",
  "getTransaction",
  "getSignatureStatuses",
  "getTokenAccountsByOwner",
  "getProgramAccounts",
  "getRecentBlockhash",
  "confirmTransaction",
  "requestAirdrop",
];

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Package rename
  rootNode.findAll({ pattern: '"@solana/web3.js"' }).forEach((node) => {
    edits.push(node.replace('"@solana/kit"'));
  });
  rootNode.findAll({ pattern: "'@solana/web3.js'" }).forEach((node) => {
    edits.push(node.replace('"@solana/kit"'));
  });

  // 2. new Connection($URL, $COMMIT) → createSolanaRpc($URL)
  rootNode.findAll({ pattern: "new Connection($URL, $COMMIT)" }).forEach((node) => {
    const url = node.getMatch("URL")?.text() ?? "";
    edits.push(node.replace(`createSolanaRpc(${url})`));
  });

  // 3. new Connection($URL) → createSolanaRpc($URL)
  rootNode.findAll({ pattern: "new Connection($URL)" }).forEach((node) => {
    const url = node.getMatch("URL")?.text() ?? "";
    edits.push(node.replace(`createSolanaRpc(${url})`));
  });

  // 4. Keypair.generate() → await generateKeyPairSigner()
  rootNode.findAll({ pattern: "Keypair.generate()" }).forEach((node) => {
    edits.push(node.replace("await generateKeyPairSigner()"));
  });

  // 5. Keypair.fromSecretKey($BYTES) → await createKeyPairSignerFromBytes($BYTES)
  rootNode.findAll({ pattern: "Keypair.fromSecretKey($BYTES)" }).forEach((node) => {
    const bytes = node.getMatch("BYTES")?.text() ?? "";
    edits.push(node.replace(`await createKeyPairSignerFromBytes(${bytes})`));
  });

  // 6. Keypair.fromSeed($SEED) → await createKeyPairSignerFromBytes($SEED)
  rootNode.findAll({ pattern: "Keypair.fromSeed($SEED)" }).forEach((node) => {
    const seed = node.getMatch("SEED")?.text() ?? "";
    edits.push(node.replace(`await createKeyPairSignerFromBytes(${seed})`));
  });

  // 7. new PublicKey($STR) → address($STR)
  rootNode.findAll({ pattern: "new PublicKey($STR)" }).forEach((node) => {
    const str = node.getMatch("STR")?.text() ?? "";
    edits.push(node.replace(`address(${str})`));
  });

  // 8. PublicKey.default → address(system program)
  rootNode.findAll({ pattern: "PublicKey.default" }).forEach((node) => {
    edits.push(node.replace('address("11111111111111111111111111111111")'));
  });

  // 9. $OBJ.publicKey → $OBJ.address
  rootNode.findAll({ pattern: "$OBJ.publicKey" }).forEach((node) => {
    const obj = node.getMatch("OBJ")?.text();
    if (!obj || obj === "PublicKey") return;
    edits.push(node.replace(`${obj}.address`));
  });

  // 10. sendRawTransaction → sendTransaction
  rootNode.findAll({ pattern: "sendRawTransaction" }).forEach((node) => {
    edits.push(node.replace("sendTransaction"));
  });

  // 11. RPC method calls → append .send()
  for (const method of RPC_METHODS) {
    rootNode.findAll({ pattern: `$OBJ.${method}($$$ARGS)` }).forEach((node) => {
      const nodeText = node.text();
      if (nodeText.endsWith(".send()")) return;
      edits.push(node.replace(`${nodeText}.send()`));
    });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
