import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./constants";

describe("constants", () => {
  it("transforms ethers.constants.AddressZero → ethers.ZeroAddress", () => {
    const input = `const zero = ethers.constants.AddressZero;`;
    const output = `const zero = ethers.ZeroAddress;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.HashZero → ethers.ZeroHash", () => {
    const input = `const hash = ethers.constants.HashZero;`;
    const output = `const hash = ethers.ZeroHash;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.MaxUint256 → ethers.MaxUint256", () => {
    const input = `const max = ethers.constants.MaxUint256;`;
    const output = `const max = ethers.MaxUint256;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.WeiPerEther → ethers.WeiPerEther", () => {
    const input = `const wpe = ethers.constants.WeiPerEther;`;
    const output = `const wpe = ethers.WeiPerEther;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.Zero → BigInt('0')", () => {
    const input = `const z = ethers.constants.Zero;`;
    const output = `const z = BigInt("0");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.One → BigInt('1')", () => {
    const input = `const one = ethers.constants.One;`;
    const output = `const one = BigInt("1");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms ethers.constants.NegativeOne → BigInt('-1')", () => {
    const input = `const neg = ethers.constants.NegativeOne;`;
    const output = `const neg = BigInt("-1");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles multiple constants in one file", () => {
    const input = `
const a = ethers.constants.AddressZero;
const b = ethers.constants.HashZero;
const c = ethers.constants.MaxUint256;
`.trim();
    const output = `
const a = ethers.ZeroAddress;
const b = ethers.ZeroHash;
const c = ethers.MaxUint256;
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated code", () => {
    const input = `const x = someLib.constants.AddressZero;`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
