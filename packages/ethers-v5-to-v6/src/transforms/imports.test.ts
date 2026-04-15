import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./imports";

describe("imports", () => {
  it("removes BigNumber from ethers imports", () => {
    const input = `import { ethers, BigNumber } from "ethers";`;
    const output = `import { ethers } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("removes utils from ethers imports", () => {
    const input = `import { ethers, utils } from "ethers";`;
    const output = `import { ethers } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("removes providers from ethers imports", () => {
    const input = `import { ethers, providers } from "ethers";`;
    const output = `import { ethers } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("removes entire import if only removed specifiers remain", () => {
    const input = `import { BigNumber, utils } from "ethers";`;
    expect(applyTransform(transform, input)).toBe("");
  });

  it("rewrites ethers/lib/utils imports to ethers", () => {
    const input = `import { parseEther, formatEther } from "ethers/lib/utils";`;
    const output = `import { parseEther, formatEther } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("rewrites ethers/lib/ethers imports to ethers", () => {
    const input = `import { ethers } from "ethers/lib/ethers";`;
    const output = `import { ethers } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("rewrites @ethersproject/* imports to ethers", () => {
    const input = `import { parseEther } from "@ethersproject/units";`;
    const output = `import { parseEther } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch non-ethers imports", () => {
    const input = `import { something } from "some-other-lib";`;
    expect(applyTransform(transform, input)).toBe(input);
  });

  it("keeps valid ethers v6 named imports untouched", () => {
    const input = `import { ethers, Contract, Wallet } from "ethers";`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
