import { WagmiProvider, createConfig, useReadContract, useWaitForTransactionReceipt, useSimulateContract } from "wagmi";


const { chains, publicClient } = /* configureChains removed in wagmi v2 — configure chains in createConfig instead */;
const client = createConfig({ chains, publicClient });

export function App() {
  const { data } = useReadContract({ address: "0x", abi, functionName: "get" });
  const { write } = useSimulateContract({ address: "0x", abi, functionName: "set" });
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  return <WagmiProvider config={client}><div /></WagmiProvider>;
}
