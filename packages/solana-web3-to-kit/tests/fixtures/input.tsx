import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const kp = Keypair.generate();
const kp2 = Keypair.fromSecretKey(secretBytes);
const pk = new PublicKey("So11111111111111111111111111111111111111112");
const owner = kp.publicKey;
const balance = await conn.getBalance(pk);
