import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./connection";

describe("connection transform", () => {
  it("transforms new Connection(url) to createSolanaRpc(url)", () => {
    const src = `
import { Connection } from "@solana/web3.js";
const conn = new Connection("https://api.mainnet-beta.solana.com");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("createSolanaRpc(");
    expect(out).not.toContain("new Connection(");
  });

  it("drops commitment argument", () => {
    const src = `
import { Connection } from "@solana/web3.js";
const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain('createSolanaRpc("https://api.mainnet-beta.solana.com")');
    expect(out).not.toContain('"confirmed"');
  });

  it("injects createSolanaRpc into existing @solana/kit import", () => {
    const src = `
import { LAMPORTS_PER_SOL } from "@solana/kit";
import { Connection } from "@solana/web3.js";
const conn = new Connection("https://api.mainnet-beta.solana.com");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("createSolanaRpc");
    // Should not duplicate the import
    const matches = (out.match(/createSolanaRpc/g) ?? []).length;
    expect(matches).toBe(2); // once in import, once in usage
  });

  it("appends .send() to getBalance calls", () => {
    const src = `
import { Connection } from "@solana/web3.js";
const conn = new Connection(url);
const bal = await conn.getBalance(pk);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain(".send()");
  });

  it("renames sendRawTransaction to sendTransaction", () => {
    const src = `
import { Connection } from "@solana/web3.js";
const conn = new Connection(url);
conn.sendRawTransaction(tx);
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("sendTransaction");
    expect(out).not.toContain("sendRawTransaction");
  });

  it("does not transform Connection from unrelated packages", () => {
    const src = `
import { Connection } from "some-other-lib";
const conn = new Connection("url");
`;
    const out = applyTransform(transform, src);
    expect(out).toContain("new Connection(");
    expect(out).not.toContain("createSolanaRpc");
  });

  it("does not double-add .send() if already present", () => {
    const src = `
import { Connection } from "@solana/web3.js";
const conn = new Connection(url);
const bal = await conn.getBalance(pk).send();
`;
    const out = applyTransform(transform, src);
    const matches = (out.match(/\.send\(\)/g) ?? []).length;
    expect(matches).toBe(1);
  });
});
