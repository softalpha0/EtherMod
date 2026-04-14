import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./wait-for-transaction";

describe("wait-for-transaction", () => {
  it("renames provider.waitForTransaction → waitForTransactionReceipt", () => {
    const input = `const receipt = await provider.waitForTransaction(hash);`;
    const output = `const receipt = await provider.waitForTransactionReceipt(hash);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles waitForTransaction with confirmations arg", () => {
    const input = `await provider.waitForTransaction(hash, 1);`;
    const output = `await provider.waitForTransactionReceipt(hash, 1);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles waitForTransaction with timeout arg", () => {
    const input = `await provider.waitForTransaction(hash, 1, 60000);`;
    const output = `await provider.waitForTransactionReceipt(hash, 1, 60000);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated methods", () => {
    const input = `await provider.waitForBlock(100);`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
