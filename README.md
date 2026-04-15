# EtherMod

Automated codemod recipes for Web3 JS/TS library migrations.
One command replaces hours of mechanical find-and-replace across your entire codebase.

Built for the [Boring AI Hackathon](https://dorahacks.io) by Codemod.

---

## Packages

| Package | Migration | Transforms | Tests | Registry |
|---|---|---|---|---|
| [`ethers-v5-to-v6`](./packages/ethers-v5-to-v6) | ethers.js v5 → v6 | 8 | 48 ✅ | v1.1.0 |
| [`wagmi-v1-to-v2`](./packages/wagmi-v1-to-v2) | wagmi v1 → v2 | 3 | 17 ✅ | v1.0.0 |
| [`solana-web3-to-kit`](./packages/solana-web3-to-kit) | @solana/web3.js v1 → @solana/kit | 4 | 26 ✅ | v1.0.0 |

**91 tests · 0 false positives**

---

## Usage

Run any migration on your project with a single command:

```bash
# ethers.js v5 → v6
npx codemod ethers-v5-to-v6 --target ./src

# wagmi v1 → v2
npx codemod wagmi-v1-to-v2 --target ./src

# @solana/web3.js v1 → @solana/kit
npx codemod solana-web3-to-kit --target ./src
```

Supports `.js`, `.jsx`, `.ts`, `.tsx` files.

---

## What Each Package Transforms

### ethers-v5-to-v6
- `ethers.utils.*` → flat `ethers.*` imports
- `ethers.providers.*` → flat `ethers.*` imports
- `ethers.BigNumber.from(x)` → `BigInt(x)`
- `ethers.constants.AddressZero` → `ethers.ZeroAddress` (and all other constants)
- `provider.getGasPrice()` → `(await provider.getFeeData()).gasPrice`
- `formatBytes32String` → `encodeBytes32String`
- `parseBytes32String` → `decodeBytes32String`
- `providers.Web3Provider` → `BrowserProvider`

### wagmi-v1-to-v2
- `WagmiConfig` → `WagmiProvider` (imports + JSX)
- `createClient` → `createConfig`
- `configureChains` removed
- All hook renames: `useContractRead` → `useReadContract`, `useContractWrite` → `useWriteContract`, `usePrepareContractWrite` → `useSimulateContract`, `useWaitForTransaction` → `useWaitForTransactionReceipt`, `useNetwork` → `useChainId`, `useSwitchNetwork` → `useSwitchChain`, and more

### solana-web3-to-kit
- `@solana/web3.js` → `@solana/kit` (package rename + import cleanup)
- `new Connection(url)` → `createSolanaRpc(url)`
- RPC method calls → append `.send()`
- `Keypair.generate()` → `await generateKeyPairSigner()`
- `Keypair.fromSecretKey(bytes)` → `await createKeyPairSignerFromBytes(bytes)`
- `new PublicKey(str)` → `address(str)`
- `.publicKey` property → `.address`

---

## How False Positives Are Prevented

- **Import-scoped matching** — identifiers are only renamed if they were actually imported from the target package
- **Null-prototype maps** — rename tables use `Object.create(null)` to prevent prototype pollution (`constructor`, `toString` etc. are never accidentally matched)
- **Chained call detection** — patterns like `BigNumber.from(2).pow(128)` are skipped when the result would produce invalid code
- **Tested on real repos** — scaffold-eth, Uniswap v3-periphery

---

## Development

```bash
# Install all workspace dependencies
npm install

# Run all tests
npm run test --workspaces

# Build all packages
npm run build --workspaces
```

---

## Case Studies

- [EtherMod v1 — Automating the ethers.js v5→v6 migration](https://paragraph.com/@softonchain)
- [EtherMod v2 — Now Migrating wagmi & Solana Too](https://paragraph.com/@softonchain@gmail.com/ethermod-v2-now-migrating-wagmi-and-solana-too?referrer=0x5B471d9938890b9E52aba4F3Ad8d2090c6D51CE7)

---

## License

MIT © [softalpha0](https://github.com/softalpha0)
