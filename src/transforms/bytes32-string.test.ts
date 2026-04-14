import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./bytes32-string";

describe("bytes32-string", () => {
  it("renames ethers.formatBytes32String → ethers.encodeBytes32String", () => {
    const input = `const b = ethers.formatBytes32String("hello");`;
    const output = `const b = ethers.encodeBytes32String("hello");`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames ethers.parseBytes32String → ethers.decodeBytes32String", () => {
    const input = `const s = ethers.parseBytes32String(bytes);`;
    const output = `const s = ethers.decodeBytes32String(bytes);`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated ethers methods", () => {
    const input = `const h = ethers.keccak256(data);`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
