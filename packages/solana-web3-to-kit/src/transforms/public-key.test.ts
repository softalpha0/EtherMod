import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./public-key";

describe("public-key transform", () => {
  it("transforms new PublicKey(str) to address(str)", () => {
    const src = `
import { PublicKey } from "@solana/web3.js";
const pk = new PublicKey("So11111111111111111111111111111111111111112");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain('address("So11111111111111111111111111111111111111112")');
    expect(out).not.toContain("new PublicKey(");
  });

  it("injects address import into @solana/kit", () => {
    const src = `
import { PublicKey } from "@solana/web3.js";
const pk = new PublicKey("mint-address");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("{ address }");
    expect(out).toContain('"@solana/kit"');
  });

  it("transforms someKeypair.publicKey to someKeypair.address", () => {
    const src = `
import { Keypair } from "@solana/web3.js";
const kp = Keypair.generate();
console.log(kp.publicKey);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("kp.address");
    expect(out).not.toContain("kp.publicKey");
  });

  it("transforms PublicKey.default to address(system program)", () => {
    const src = `
import { PublicKey } from "@solana/web3.js";
const pk = PublicKey.default;
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("address(");
    expect(out).toContain("11111111111111111111111111111111");
  });

  it("does not transform PublicKey from unrelated packages", () => {
    const src = `
import { PublicKey } from "some-other-lib";
const pk = new PublicKey("addr");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("new PublicKey(");
    expect(out).not.toContain("address(");
  });

  it("transforms .publicKey on deeply nested expressions", () => {
    const src = `
import { PublicKey } from "@solana/web3.js";
const owner = wallet.keypair.publicKey;
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("wallet.keypair.address");
    expect(out).not.toContain(".publicKey");
  });
});
