import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./bignumber-to-bigint";

describe("bignumber-to-bigint", () => {
  it("converts ethers.BigNumber.from(string) → BigInt(string)", () => {
    const input = `const n = ethers.BigNumber.from("100");`;
    const output = `const n = BigInt("100");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("converts ethers.BigNumber.from(number) → BigInt(number)", () => {
    const input = `const n = ethers.BigNumber.from(100);`;
    const output = `const n = BigInt(100);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("converts ethers.BigNumber.from(variable) → BigInt(variable)", () => {
    const input = `const n = ethers.BigNumber.from(someVar);`;
    const output = `const n = BigInt(someVar);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("converts directly imported BigNumber.from(x) → BigInt(x)", () => {
    const input = `const n = BigNumber.from("1000000000000000000");`;
    const output = `const n = BigInt("1000000000000000000");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles multiple BigNumber.from calls", () => {
    const input = `
const a = ethers.BigNumber.from("100");
const b = BigNumber.from(200);
`.trim();
    const output = `
const a = BigInt("100");
const b = BigInt(200);
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated code", () => {
    const input = `const x = someLib.BigNumber.from("100");`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
