/**
 * Transform: wagmi v1 hook renames → v2
 *
 * wagmi v2 renamed most hooks for clarity and consistency.
 *
 * Examples:
 *   useContractRead(...)       →  useReadContract(...)
 *   useContractWrite(...)      →  useWriteContract(...)
 *   useContractEvent(...)      →  useWatchContractEvent(...)
 *   usePrepareContractWrite()  →  useSimulateContract(...)
 *   useContractReads(...)      →  useReadContracts(...)
 *   useWaitForTransaction(...) →  useWaitForTransactionReceipt(...)
 *   useWebSocketPublicClient() →  usePublicClient({ transport: webSocket })
 */

import type { Transform, ASTPath, Identifier, ImportDeclaration } from "jscodeshift";

const HOOK_RENAMES = Object.assign(Object.create(null) as Record<string, string>, {
  useContractRead: "useReadContract",
  useContractWrite: "useWriteContract",
  useContractEvent: "useWatchContractEvent",
  usePrepareContractWrite: "useSimulateContract",
  useContractReads: "useReadContracts",
  useWaitForTransaction: "useWaitForTransactionReceipt",
  usePrepareContractRead: "useSimulateContract",
  useNetwork: "useChainId",
  useSwitchNetwork: "useSwitchChain",
  useWebSocketPublicClient: "usePublicClient",
});

const WAGMI_SOURCES = new Set(["wagmi", "wagmi/hooks"]);

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  // Track which hooks were imported from wagmi
  const importedHooks = new Set<string>();

  // 1. Rename import specifiers from wagmi
  root.find(j.ImportDeclaration).forEach((path: ASTPath<ImportDeclaration>) => {
    const src = path.node.source.value as string;
    if (!WAGMI_SOURCES.has(src)) return;

    (path.node.specifiers ?? []).forEach((spec) => {
      if (spec.type !== "ImportSpecifier") return;
      const name = (spec.imported as { name: string }).name;
      if (Object.hasOwn(HOOK_RENAMES, name)) {
        importedHooks.add(name);
        (spec.imported as { name: string }).name = HOOK_RENAMES[name];
        (spec.local as { name: string }).name = HOOK_RENAMES[name];
        changed = true;
      }
    });
  });

  // 2. Rename usages in code (only hooks we know came from wagmi)
  if (importedHooks.size > 0) {
    root.find(j.Identifier).forEach((path: ASTPath<Identifier>) => {
      if (
        importedHooks.has(path.node.name) &&
        path.parent?.node?.type !== "ImportSpecifier" &&
        path.parent?.node?.type !== "MemberExpression"
      ) {
        path.node.name = HOOK_RENAMES[path.node.name];
        changed = true;
      }
    });
  }

  return changed ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
module.exports = transform;
