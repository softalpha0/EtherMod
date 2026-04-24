import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

// ─── Rename maps ──────────────────────────────────────────────────────────────

const HOOK_RENAMES: Record<string, string> = {
  useContractRead: "useReadContract",
  useContractWrite: "useWriteContract",
  useContractEvent: "useWatchContractEvent",
  usePrepareContractWrite: "useSimulateContract",
  useContractReads: "useReadContracts",
  useWaitForTransaction: "useWaitForTransactionReceipt",
  useNetwork: "useChainId",
  useSwitchNetwork: "useSwitchChain",
  useWebSocketPublicClient: "usePublicClient",
};

const IMPORT_RENAMES: Record<string, string> = {
  WagmiConfig: "WagmiProvider",
  createClient: "createConfig",
};

// ─── Transform ────────────────────────────────────────────────────────────────

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Rename wagmi hook identifiers
  for (const [oldName, newName] of Object.entries(HOOK_RENAMES)) {
    rootNode
      .findAll({ rule: { kind: "identifier", regex: `^${oldName}$` } })
      .forEach((node) => {
        edits.push(node.replace(newName));
      });
  }

  // 2. WagmiConfig → WagmiProvider, createClient → createConfig
  for (const [oldName, newName] of Object.entries(IMPORT_RENAMES)) {
    rootNode
      .findAll({ rule: { kind: "identifier", regex: `^${oldName}$` } })
      .forEach((node) => {
        edits.push(node.replace(newName));
      });
  }

  // Also handle JSX element names: <WagmiConfig> → <WagmiProvider>
  rootNode
    .findAll({ rule: { kind: "jsx_opening_element", has: { field: "name", regex: "^WagmiConfig$" } } })
    .forEach((node) => {
      const name = node.find({ rule: { kind: "identifier", regex: "^WagmiConfig$" } });
      if (name) edits.push(name.replace("WagmiProvider"));
    });

  rootNode
    .findAll({ rule: { kind: "jsx_closing_element", has: { field: "name", regex: "^WagmiConfig$" } } })
    .forEach((node) => {
      const name = node.find({ rule: { kind: "identifier", regex: "^WagmiConfig$" } });
      if (name) edits.push(name.replace("WagmiProvider"));
    });

  // 3. Remove wagmi/providers/* imports entirely
  rootNode
    .findAll({ rule: { kind: "import_statement", has: { kind: "string", regex: "wagmi/providers" } } })
    .forEach((node) => {
      edits.push(node.replace(""));
    });

  // 4. Remove configureChains variable declarations
  //    e.g. const { chains, publicClient } = configureChains(...)
  rootNode
    .findAll({ pattern: "configureChains($$$ARGS)" })
    .forEach((node) => {
      // Replace the whole call with a comment
      edits.push(
        node.replace(
          "/* configureChains removed in wagmi v2 — configure chains in createConfig instead */"
        )
      );
    });

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
