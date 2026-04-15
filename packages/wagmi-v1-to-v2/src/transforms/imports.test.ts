import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./imports";

describe("wagmi imports", () => {
  it("removes configureChains from imports", () => {
    const input = `import { configureChains, createClient } from "wagmi";`;
    const output = `import { createConfig } from "wagmi";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames WagmiConfig → WagmiProvider", () => {
    const input = `import { WagmiConfig } from "wagmi";`;
    const output = `import { WagmiProvider } from "wagmi";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames createClient → createConfig", () => {
    const input = `import { createClient } from "wagmi";`;
    const output = `import { createConfig } from "wagmi";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("removes wagmi/providers/* imports entirely", () => {
    const input = `import { publicProvider } from "wagmi/providers/public";`;
    expect(applyTransform(transform, input)).toBe("");
  });

  it("removes wagmi/providers/jsonRpc imports", () => {
    const input = `import { jsonRpcProvider } from "wagmi/providers/jsonRpc";`;
    expect(applyTransform(transform, input)).toBe("");
  });

  it("keeps valid wagmi v2 imports untouched", () => {
    const input = `import { useAccount, useBalance } from "wagmi";`;
    expect(applyTransform(transform, input)).toBe(input);
  });

  it("keeps wagmi/chains imports untouched", () => {
    const input = `import { mainnet, polygon } from "wagmi/chains";`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
