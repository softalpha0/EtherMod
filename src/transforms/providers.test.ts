import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./providers";

describe("providers", () => {
  it("flattens new ethers.providers.JsonRpcProvider", () => {
    const input = `const provider = new ethers.providers.JsonRpcProvider(url);`;
    const output = `const provider = new ethers.JsonRpcProvider(url);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens new ethers.providers.WebSocketProvider", () => {
    const input = `const provider = new ethers.providers.WebSocketProvider(url);`;
    const output = `const provider = new ethers.WebSocketProvider(url);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames Web3Provider → BrowserProvider", () => {
    const input = `const provider = new ethers.providers.Web3Provider(window.ethereum);`;
    const output = `const provider = new ethers.BrowserProvider(window.ethereum);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.providers.AlchemyProvider", () => {
    const input = `const provider = new ethers.providers.AlchemyProvider("homestead", apiKey);`;
    const output = `const provider = new ethers.AlchemyProvider("homestead", apiKey);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.providers.InfuraProvider", () => {
    const input = `const provider = new ethers.providers.InfuraProvider("mainnet", projectId);`;
    const output = `const provider = new ethers.InfuraProvider("mainnet", projectId);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens type reference ethers.providers.JsonRpcProvider", () => {
    const input = `let provider: ethers.providers.JsonRpcProvider;`;
    const output = `let provider: ethers.JsonRpcProvider;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated code", () => {
    const input = `const x = new someLib.providers.JsonRpcProvider(url);`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
