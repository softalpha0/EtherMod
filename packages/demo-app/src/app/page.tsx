"use client";

import { useState } from "react";

type Migration = "ethers" | "wagmi" | "solana";

const TABS: { id: Migration; label: string }[] = [
  { id: "ethers", label: "ethers.js v5 → v6" },
  { id: "wagmi",  label: "wagmi v1 → v2" },
  { id: "solana", label: "@solana/web3.js → @solana/kit" },
];

const DEFAULTS: Record<Migration, string> = {
  ethers: `import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider("https://rpc.url");
const amount = ethers.BigNumber.from("1000");
const zero = ethers.constants.AddressZero;
const gas = await provider.getGasPrice();
const encoded = ethers.utils.formatBytes32String("hello");`,

  wagmi: `import { WagmiConfig, createClient, useContractRead, useWaitForTransaction, usePrepareContractWrite } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

const client = createClient({ chains });

export function App() {
  const { data } = useContractRead({ address: "0x", abi, functionName: "get" });
  const { write } = usePrepareContractWrite({ address: "0x", abi, functionName: "set" });
  const { isSuccess } = useWaitForTransaction({ hash: txHash });
  return <WagmiConfig config={client}><div /></WagmiConfig>;
}`,

  solana: `import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const kp = Keypair.generate();
const kp2 = Keypair.fromSecretKey(secretBytes);
const pk = new PublicKey("So11111111111111111111111111111111111111112");
const owner = kp.publicKey;
const balance = await conn.getBalance(pk);`,
};

const COMMANDS: Record<Migration, string> = {
  ethers: "npx codemod ethers-v5-to-v6 --target ./src",
  wagmi:  "npx codemod wagmi-v1-to-v2 --target ./src",
  solana: "npx codemod solana-web3-to-kit --target ./src",
};

export default function Home() {
  const [tab, setTab] = useState<Migration>("ethers");
  const [code, setCode] = useState(DEFAULTS.ethers);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "modified" | "unchanged" | "error">("idle");

  function switchTab(t: Migration) {
    setTab(t);
    setCode(DEFAULTS[t]);
    setOutput("");
    setStatus("idle");
  }

  async function runMigration() {
    setStatus("loading");
    setOutput("");
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, migration: tab }),
      });
      const data = await res.json();
      if (data.error) {
        setOutput(data.error);
        setStatus("error");
      } else if (data.result === code) {
        setOutput(data.result);
        setStatus("unchanged");
      } else {
        setOutput(data.result);
        setStatus("modified");
      }
    } catch (e) {
      setOutput(String(e));
      setStatus("error");
    }
  }

  function reset() {
    setCode(DEFAULTS[tab]);
    setOutput("");
    setStatus("idle");
  }

  return (
    <main className="container">
      <div className="header">
        <h1>⚡ EtherMod</h1>
        <p>
          Automated Web3 migration playground &nbsp;·&nbsp;{" "}
          <a href="https://github.com/softalpha0/EtherMod" target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          &nbsp;·&nbsp;{" "}
          <a href="https://codemod.com" target="_blank" rel="noreferrer">
            Codemod Registry
          </a>
        </p>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="editors">
        <div className="editor-box">
          <span className="editor-label before">Before (paste your code)</span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="editor-box">
          <span className="editor-label after">
            After{" "}
            {status === "modified" && <span className="badge modified">✓ Modified</span>}
            {status === "unchanged" && <span className="badge unchanged">No changes</span>}
          </span>
          <div className={`output ${status === "unchanged" ? "unchanged" : status === "error" ? "error" : ""}`}>
            {status === "idle" && "// Output will appear here..."}
            {status === "loading" && "// Running migration..."}
            {(status === "modified" || status === "unchanged" || status === "error") && output}
          </div>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn-run"
          onClick={runMigration}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Running..." : "▶ Run Migration"}
        </button>
        <button className="btn-reset" onClick={reset}>Reset</button>
        <code style={{ fontSize: "0.8rem", color: "#555", marginLeft: "auto" }}>
          {COMMANDS[tab]}
        </code>
      </div>

      <div className="footer">
        <p>
          Built for the{" "}
          <a href="https://dorahacks.io/hackathon/boring-ai/detail" target="_blank" rel="noreferrer">
            Boring AI Hackathon
          </a>{" "}
          by Codemod &nbsp;·&nbsp;{" "}
          <a href="https://github.com/softalpha0/EtherMod" target="_blank" rel="noreferrer">
            softalpha0/EtherMod
          </a>
        </p>
      </div>
    </main>
  );
}
