import { WagmiConfig, createClient, useContractRead, useWaitForTransaction, usePrepareContractWrite } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);
const client = createClient({ chains, publicClient });

export function App() {
  const { data } = useContractRead({ address: "0x", abi, functionName: "get" });
  const { write } = usePrepareContractWrite({ address: "0x", abi, functionName: "set" });
  const { isSuccess } = useWaitForTransaction({ hash: txHash });

  return <WagmiConfig config={client}><div /></WagmiConfig>;
}
