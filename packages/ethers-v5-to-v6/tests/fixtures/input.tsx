import { ethers } from "ethers";
import { formatEther } from "ethers/lib/utils";

const provider = new ethers.providers.JsonRpcProvider("https://rpc.url");
const amount = ethers.BigNumber.from("1000");
const zero = ethers.constants.AddressZero;
const hash = ethers.constants.HashZero;
const gas = await provider.getGasPrice();
const encoded = ethers.utils.formatBytes32String("hello");
const decoded = ethers.utils.parseBytes32String(bytes);
