import type { Codemod, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

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

const codemod: Codemod<TSX> = (root) => {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // 1. Hook renames
  for (const [oldName, newName] of Object.entries(HOOK_RENAMES)) {
    rootNode.findAll(oldName).forEach((node) => {
      edits.push(node.replace(newName));
    });
  }

  // 2. WagmiConfig → WagmiProvider
  rootNode.findAll("WagmiConfig").forEach((node) => {
    edits.push(node.replace("WagmiProvider"));
  });

  // 3. createClient → createConfig
  rootNode.findAll("createClient").forEach((node) => {
    edits.push(node.replace("createConfig"));
  });

  // 4. configureChains($$$ARGS) → comment
  rootNode.findAll("configureChains($$$ARGS)").forEach((node) => {
    edits.push(
      node.replace(
        "/* configureChains removed in wagmi v2 — configure chains in createConfig instead */"
      )
    );
  });

  // 5. wagmi/providers/* → wagmi
  const wagmiProviders = [
    "wagmi/providers/public",
    "wagmi/providers/alchemy",
    "wagmi/providers/infura",
  ];
  for (const src of wagmiProviders) {
    rootNode.findAll(`"${src}"`).forEach((node) => {
      edits.push(node.replace('"wagmi"'));
    });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
