import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./keypair";

describe("keypair transform", () => {
  it("transforms Keypair.generate() to await generateKeyPairSigner()", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp = Keypair.generate();
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("await generateKeyPairSigner()");
    expect(out).not.toContain("Keypair.generate()");
  });

  it("transforms Keypair.fromSecretKey(bytes) to await createKeyPairSignerFromBytes(bytes)", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp = Keypair.fromSecretKey(secretBytes);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("await createKeyPairSignerFromBytes(secretBytes)");
    expect(out).not.toContain("Keypair.fromSecretKey");
  });

  it("transforms Keypair.fromSeed(seed) to await createKeyPairSignerFromBytes(seed)", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp = Keypair.fromSeed(seed);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("await createKeyPairSignerFromBytes(seed)");
    expect(out).not.toContain("Keypair.fromSeed");
  });

  it("injects generateKeyPairSigner into @solana/kit import", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp = Keypair.generate();
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("generateKeyPairSigner");
    // Appears in import and in usage
    const count = (out.match(/generateKeyPairSigner/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("injects both imports when both methods used", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp1 = Keypair.generate();
const kp2 = Keypair.fromSecretKey(bytes);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("generateKeyPairSigner");
    expect(out).toContain("createKeyPairSignerFromBytes");
  });

  it("does not transform Keypair from unrelated packages", () => {
    const src = `
import { Keypair } from "some-other-lib";
const kp = Keypair.generate();
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("Keypair.generate()");
    expect(out).not.toContain("generateKeyPairSigner");
  });
});
