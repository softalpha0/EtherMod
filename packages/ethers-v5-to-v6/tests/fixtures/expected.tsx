import { ethers } from "ethers";
import { formatEther } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc.url");
const amount = BigInt("1000");
const zero = ethers.ZeroAddress;
const hash = ethers.ZeroHash;
const gas = await (await provider.getFeeData()).gasPrice;
const encoded = ethers.encodeBytes32String("hello");
const decoded = ethers.decodeBytes32String(bytes);
