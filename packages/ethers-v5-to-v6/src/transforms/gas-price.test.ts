import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./gas-price";

describe("gas-price", () => {
  it("transforms await provider.getGasPrice()", () => {
    const input = `const gp = await provider.getGasPrice();`;
    const output = `const gp = (await provider.getFeeData()).gasPrice;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("transforms await signer.getGasPrice()", () => {
    const input = `const gp = await signer.getGasPrice();`;
    const output = `const gp = (await signer.getFeeData()).gasPrice;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch non-await getGasPrice calls", () => {
    const input = `const gp = provider.getGasPrice();`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
