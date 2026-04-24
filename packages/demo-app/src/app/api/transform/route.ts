import { NextRequest, NextResponse } from "next/server";
import jscodeshift from "jscodeshift";
import type { FileInfo, API } from "jscodeshift";

// ─── Inline transforms (copied from packages) ────────────────────────────────
// We inline them here to avoid complex monorepo imports in Vercel

function runTransform(
  source: string,
  transformFn: (file: FileInfo, api: API) => string | null | undefined
): string {
  const j = jscodeshift.withParser("tsx");
  const api: API = {
    j,
    jscodeshift: j,
    stats: () => {},
    report: () => {},
  };
  const result = transformFn({ path: "input.tsx", source }, api);
  return typeof result === "string" ? result : source;
}

// ─── ethers v5 → v6 ──────────────────────────────────────────────────────────

function ethersTransform(source: string): string {
  let s = source;

  // Sub-path imports → "ethers"
  s = s.replace(/from ["']ethers\/lib\/utils["']/g, 'from "ethers"');
  s = s.replace(/from ["']ethers\/lib\/providers["']/g, 'from "ethers"');
  s = s.replace(/from ["']@ethersproject\/[^"']+["']/g, 'from "ethers"');

  s = runTransform(s, (file, api) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let dirty = false;

    // ethers.BigNumber.from(x) → BigInt(x)
    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "MemberExpression", object: { type: "Identifier", name: "ethers" }, property: { type: "Identifier", name: "BigNumber" } },
        property: { type: "Identifier", name: "from" },
      },
    }).forEach((path) => {
      dirty = true;
      path.replace(j.callExpression(j.identifier("BigInt"), path.node.arguments));
    });

    // BigNumber.from(x) → BigInt(x)
    root.find(j.CallExpression, {
      callee: { type: "MemberExpression", object: { type: "Identifier", name: "BigNumber" }, property: { type: "Identifier", name: "from" } },
    }).forEach((path) => {
      dirty = true;
      path.replace(j.callExpression(j.identifier("BigInt"), path.node.arguments));
    });

    // ethers.utils.X → ethers.X
    root.find(j.MemberExpression, {
      object: { type: "MemberExpression", object: { type: "Identifier", name: "ethers" }, property: { type: "Identifier", name: "utils" } },
    }).forEach((path) => {
      dirty = true;
      path.replace(j.memberExpression(j.identifier("ethers"), path.node.property));
    });

    // ethers.providers.X → ethers.X (Web3Provider → BrowserProvider)
    root.find(j.MemberExpression, {
      object: { type: "MemberExpression", object: { type: "Identifier", name: "ethers" }, property: { type: "Identifier", name: "providers" } },
    }).forEach((path) => {
      dirty = true;
      const prop = path.node.property;
      if (prop.type === "Identifier" && prop.name === "Web3Provider") {
        path.replace(j.memberExpression(j.identifier("ethers"), j.identifier("BrowserProvider")));
      } else {
        path.replace(j.memberExpression(j.identifier("ethers"), prop));
      }
    });

    // ethers.constants.X → renamed
    const CONSTANTS: Record<string, string> = {
      AddressZero: "ethers.ZeroAddress", HashZero: "ethers.ZeroHash",
      MaxUint256: "ethers.MaxUint256", WeiPerEther: "ethers.WeiPerEther",
      NegativeOne: "BigInt(-1)", Zero: "BigInt(0)", One: "BigInt(1)", Two: "BigInt(2)",
    };
    root.find(j.MemberExpression, {
      object: { type: "MemberExpression", object: { type: "Identifier", name: "ethers" }, property: { type: "Identifier", name: "constants" } },
      property: { type: "Identifier" },
    }).forEach((path) => {
      const name = (path.node.property as { name: string }).name;
      if (CONSTANTS[name]) {
        dirty = true;
        path.replace(j(CONSTANTS[name]).find(j.MemberExpression).paths()[0]?.node ?? j.identifier(CONSTANTS[name]));
      }
    });

    // getGasPrice() → getFeeData().gasPrice
    root.find(j.CallExpression, {
      callee: { type: "MemberExpression", property: { type: "Identifier", name: "getGasPrice" } },
    }).forEach((path) => {
      dirty = true;
      const obj = (path.node.callee as { object: unknown }).object;
      path.replace(
        j.memberExpression(
          j.awaitExpression(j.callExpression(j.memberExpression(obj as never, j.identifier("getFeeData")), [])),
          j.identifier("gasPrice")
        )
      );
    });

    return dirty ? root.toSource({ quote: "double" }) : null;
  });

  return s;
}

// ─── wagmi v1 → v2 ───────────────────────────────────────────────────────────

function wagmiTransform(source: string): string {
  return runTransform(source, (file, api) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let dirty = false;

    const HOOKS: Record<string, string> = {
      useContractRead: "useReadContract",
      useContractWrite: "useWriteContract",
      useContractEvent: "useWatchContractEvent",
      usePrepareContractWrite: "useSimulateContract",
      useContractReads: "useReadContracts",
      useWaitForTransaction: "useWaitForTransactionReceipt",
      useNetwork: "useChainId",
      useSwitchNetwork: "useSwitchChain",
      useWebSocketPublicClient: "usePublicClient",
      WagmiConfig: "WagmiProvider",
      createClient: "createConfig",
    };

    root.find(j.Identifier).forEach((path) => {
      if (Object.hasOwn(HOOKS, path.node.name)) {
        dirty = true;
        path.node.name = HOOKS[path.node.name];
      }
    });

    root.find(j.JSXIdentifier).forEach((path) => {
      if (Object.hasOwn(HOOKS, path.node.name)) {
        dirty = true;
        path.node.name = HOOKS[path.node.name];
      }
    });

    // Remove wagmi/providers/* imports
    root.find(j.ImportDeclaration).forEach((path) => {
      const val = String(path.node.source.value);
      if (val.startsWith("wagmi/providers/")) {
        dirty = true;
        path.prune();
      }
    });

    return dirty ? root.toSource({ quote: "double" }) : null;
  });
}

// ─── @solana/web3.js → @solana/kit ───────────────────────────────────────────

function solanaTransform(source: string): string {
  return runTransform(source, (file, api) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let dirty = false;

    // Package rename
    root.find(j.ImportDeclaration, { source: { value: "@solana/web3.js" } }).forEach((path) => {
      dirty = true;
      path.node.source.value = "@solana/kit";
    });

    // new Connection(url) → createSolanaRpc(url)
    root.find(j.NewExpression, { callee: { type: "Identifier", name: "Connection" } }).forEach((path) => {
      dirty = true;
      path.replace(j.callExpression(j.identifier("createSolanaRpc"), [path.node.arguments[0]]));
    });

    // Keypair.generate() → await generateKeyPairSigner()
    root.find(j.CallExpression, {
      callee: { type: "MemberExpression", object: { type: "Identifier", name: "Keypair" }, property: { type: "Identifier", name: "generate" } },
    }).forEach((path) => {
      dirty = true;
      path.replace(j.awaitExpression(j.callExpression(j.identifier("generateKeyPairSigner"), [])));
    });

    // Keypair.fromSecretKey(x) → await createKeyPairSignerFromBytes(x)
    root.find(j.CallExpression, {
      callee: { type: "MemberExpression", object: { type: "Identifier", name: "Keypair" }, property: { type: "Identifier", name: "fromSecretKey" } },
    }).forEach((path) => {
      dirty = true;
      path.replace(j.awaitExpression(j.callExpression(j.identifier("createKeyPairSignerFromBytes"), path.node.arguments)));
    });

    // new PublicKey(x) → address(x)
    root.find(j.NewExpression, { callee: { type: "Identifier", name: "PublicKey" } }).forEach((path) => {
      dirty = true;
      path.replace(j.callExpression(j.identifier("address"), path.node.arguments));
    });

    // .publicKey → .address
    root.find(j.MemberExpression, { property: { type: "Identifier", name: "publicKey" } }).forEach((path) => {
      if ((path.node.object as { name?: string }).name === "PublicKey") return;
      dirty = true;
      (path.node.property as { name: string }).name = "address";
    });

    return dirty ? root.toSource({ quote: "double" }) : null;
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { code, migration } = await req.json();

  if (!code || !migration) {
    return NextResponse.json({ error: "Missing code or migration" }, { status: 400 });
  }

  try {
    let result: string;
    if (migration === "ethers") result = ethersTransform(code);
    else if (migration === "wagmi") result = wagmiTransform(code);
    else if (migration === "solana") result = solanaTransform(code);
    else return NextResponse.json({ error: "Unknown migration" }, { status: 400 });

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
