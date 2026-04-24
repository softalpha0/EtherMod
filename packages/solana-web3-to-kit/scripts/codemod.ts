import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

// ─── RPC methods that need .send() appended ───────────────────────────────────

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

// ─── Transform ────────────────────────────────────────────────────────────────

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Package rename: "@solana/web3.js" → "@solana/kit"
  rootNode
    .findAll({ rule: { kind: "string", regex: `^["']@solana/web3\\.js["']$` } })
    .forEach((node) => {
      edits.push(node.replace('"@solana/kit"'));
    });

  // 2. new Connection($URL) → createSolanaRpc($URL)
  //    new Connection($URL, $COMMIT) → createSolanaRpc($URL)  (drop commitment)
  rootNode
    .findAll({ pattern: "new Connection($URL, $COMMIT)" })
    .forEach((node) => {
      const url = node.getMatch("URL")?.text() ?? "";
      edits.push(node.replace(`createSolanaRpc(${url})`));
    });

  rootNode
    .findAll({ pattern: "new Connection($URL)" })
    .forEach((node) => {
      const url = node.getMatch("URL")?.text() ?? "";
      edits.push(node.replace(`createSolanaRpc(${url})`));
    });

  // 3. Keypair.generate() → await generateKeyPairSigner()
  rootNode
    .findAll({ pattern: "Keypair.generate()" })
    .forEach((node) => {
      edits.push(node.replace("await generateKeyPairSigner()"));
    });

  // 4. Keypair.fromSecretKey($BYTES) → await createKeyPairSignerFromBytes($BYTES)
  rootNode
    .findAll({ pattern: "Keypair.fromSecretKey($BYTES)" })
    .forEach((node) => {
      const bytes = node.getMatch("BYTES")?.text() ?? "";
      edits.push(node.replace(`await createKeyPairSignerFromBytes(${bytes})`));
    });

  // 5. Keypair.fromSeed($SEED) → await createKeyPairSignerFromBytes($SEED)
  rootNode
    .findAll({ pattern: "Keypair.fromSeed($SEED)" })
    .forEach((node) => {
      const seed = node.getMatch("SEED")?.text() ?? "";
      edits.push(node.replace(`await createKeyPairSignerFromBytes(${seed})`));
    });

  // 6. new PublicKey($STR) → address($STR)
  rootNode
    .findAll({ pattern: "new PublicKey($STR)" })
    .forEach((node) => {
      const str = node.getMatch("STR")?.text() ?? "";
      edits.push(node.replace(`address(${str})`));
    });

  // 7. PublicKey.default → address("11111111111111111111111111111111")
  rootNode
    .findAll({ pattern: "PublicKey.default" })
    .forEach((node) => {
      edits.push(
        node.replace('address("11111111111111111111111111111111")')
      );
    });

  // 8. $OBJ.publicKey → $OBJ.address
  rootNode
    .findAll({ pattern: "$OBJ.publicKey" })
    .forEach((node) => {
      const obj = node.getMatch("OBJ")?.text();
      // Skip PublicKey.publicKey (static class reference — doesn't exist)
      if (!obj || obj === "PublicKey") return;
      edits.push(node.replace(`${obj}.address`));
    });

  // 9. sendRawTransaction → sendTransaction
  rootNode
    .findAll({ rule: { kind: "identifier", regex: "^sendRawTransaction$" } })
    .forEach((node) => {
      edits.push(node.replace("sendTransaction"));
    });

  // 10. Append .send() to RPC method calls
  for (const method of RPC_METHODS) {
    rootNode
      .findAll({ pattern: `$OBJ.${method}($$$ARGS)` })
      .forEach((node) => {
        // Skip if already wrapped: expr.method(args).send()
        const parent = node.parent();
        if (parent) {
          const parentText = parent.text();
          if (parentText.endsWith(".send()") || parentText.includes(".send()")) {
            return;
          }
        }
        edits.push(node.replace(`${node.text()}.send()`));
      });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
