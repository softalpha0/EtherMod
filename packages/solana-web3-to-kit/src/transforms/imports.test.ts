import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./imports";

describe("imports transform", () => {
  it("renames @solana/web3.js to @solana/kit", () => {
    // LAMPORTS_PER_SOL survives the transform (no removal), so @solana/kit import stays
    const src = `import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    expect(out).toContain('"@solana/kit"');
    expect(out).not.toContain("@solana/web3.js");
  });

  it("drops Connection, Keypair, PublicKey specifiers", () => {
    const src = `import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    expect(out).not.toContain("Connection");
    expect(out).not.toContain("Keypair");
    expect(out).not.toContain("PublicKey");
    expect(out).toContain("LAMPORTS_PER_SOL");
  });

  it("drops entire import when all specifiers are removed", () => {
    const src = `import { Connection, Keypair, PublicKey } from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    // No import declaration should remain for @solana/kit (no surviving specifiers)
    expect(out.trim()).toBe("");
  });

  it("renames sendAndConfirmTransaction", () => {
    const src = `import { sendAndConfirmTransaction } from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    expect(out).toContain("sendAndConfirmTransactionFactory");
    expect(out).not.toContain("sendAndConfirmTransaction,");
  });

  it("drops Transaction specifier (no direct replacement)", () => {
    const src = `import { Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    expect(out).not.toContain("Transaction");
    expect(out).toContain("LAMPORTS_PER_SOL");
  });

  it("preserves unrelated imports unchanged", () => {
    const src = `import React from "react";`;
    const out = applyTransform(transform, src);
    expect(out).toBe(src);
  });

  it("handles namespace imports gracefully", () => {
    const src = `import * as web3 from "@solana/web3.js";`;
    const out = applyTransform(transform, src);
    expect(out).toContain('"@solana/kit"');
    expect(out).toContain("* as web3");
  });
});
