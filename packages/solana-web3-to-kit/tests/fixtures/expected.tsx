import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/kit";

const conn = createSolanaRpc("https://api.mainnet-beta.solana.com");
const kp = await generateKeyPairSigner();
const kp2 = await createKeyPairSignerFromBytes(secretBytes);
const pk = address("So11111111111111111111111111111111111111112");
const owner = kp.address;
const balance = await conn.getBalance(pk).send();
