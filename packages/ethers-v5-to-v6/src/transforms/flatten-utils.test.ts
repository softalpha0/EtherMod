import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./flatten-utils";

describe("flatten-utils", () => {
  it("flattens ethers.utils.parseEther", () => {
    const input = `const wei = ethers.utils.parseEther("1.0");`;
    const output = `const wei = ethers.parseEther("1.0");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.utils.formatEther", () => {
    const input = `const eth = ethers.utils.formatEther(value);`;
    const output = `const eth = ethers.formatEther(value);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.utils.id", () => {
    const input = `const hash = ethers.utils.id("Transfer(address,address,uint256)");`;
    const output = `const hash = ethers.id("Transfer(address,address,uint256)");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.utils.keccak256", () => {
    const input = `const hash = ethers.utils.keccak256(data);`;
    const output = `const hash = ethers.keccak256(data);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("flattens ethers.utils.defaultAbiCoder.encode", () => {
    const input = `const encoded = ethers.utils.defaultAbiCoder.encode(["uint256"], [value]);`;
    const output = `const encoded = ethers.defaultAbiCoder.encode(["uint256"], [value]);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles multiple usages in one file", () => {
    const input = `
const a = ethers.utils.parseEther("1.0");
const b = ethers.utils.formatUnits(value, 18);
const c = ethers.utils.getAddress(addr);
`.trim();
    const output = `
const a = ethers.parseEther("1.0");
const b = ethers.formatUnits(value, 18);
const c = ethers.getAddress(addr);
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated code", () => {
    const input = `const x = someLib.utils.parse("foo");`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
