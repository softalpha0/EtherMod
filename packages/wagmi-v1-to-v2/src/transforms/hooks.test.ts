import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./hooks";

describe("wagmi hooks", () => {
  it("renames useContractRead → useReadContract in import and usage", () => {
    const input = `
import { useContractRead } from "wagmi";
const { data } = useContractRead({ address, abi, functionName: "balanceOf" });
`.trim();
    const output = `
import { useReadContract } from "wagmi";
const { data } = useReadContract({ address, abi, functionName: "balanceOf" });
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames useContractWrite → useWriteContract", () => {
    const input = `
import { useContractWrite } from "wagmi";
const { write } = useContractWrite({ address, abi, functionName: "transfer" });
`.trim();
    const output = `
import { useWriteContract } from "wagmi";
const { write } = useWriteContract({ address, abi, functionName: "transfer" });
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames usePrepareContractWrite → useSimulateContract", () => {
    const input = `
import { usePrepareContractWrite } from "wagmi";
const { config } = usePrepareContractWrite({ address, abi, functionName: "mint" });
`.trim();
    const output = `
import { useSimulateContract } from "wagmi";
const { config } = useSimulateContract({ address, abi, functionName: "mint" });
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames useWaitForTransaction → useWaitForTransactionReceipt", () => {
    const input = `
import { useWaitForTransaction } from "wagmi";
const { data } = useWaitForTransaction({ hash });
`.trim();
    const output = `
import { useWaitForTransactionReceipt } from "wagmi";
const { data } = useWaitForTransactionReceipt({ hash });
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames useNetwork → useChainId", () => {
    const input = `
import { useNetwork } from "wagmi";
const { chain } = useNetwork();
`.trim();
    const output = `
import { useChainId } from "wagmi";
const { chain } = useChainId();
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("renames useSwitchNetwork → useSwitchChain", () => {
    const input = `
import { useSwitchNetwork } from "wagmi";
const { switchNetwork } = useSwitchNetwork();
`.trim();
    const output = `
import { useSwitchChain } from "wagmi";
const { switchNetwork } = useSwitchChain();
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("handles multiple hooks in one file", () => {
    const input = `
import { useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
const { data } = useContractRead({ address, abi, functionName: "balanceOf" });
const { write } = useContractWrite({ address, abi, functionName: "transfer" });
const { data: receipt } = useWaitForTransaction({ hash });
`.trim();
    const output = `
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
const { data } = useReadContract({ address, abi, functionName: "balanceOf" });
const { write } = useWriteContract({ address, abi, functionName: "transfer" });
const { data: receipt } = useWaitForTransactionReceipt({ hash });
`.trim();
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch non-wagmi hooks", () => {
    const input = `
import { useContractRead } from "some-other-lib";
const { data } = useContractRead({ address });
`.trim();
    expect(applyTransform(transform, input)).toBe(input);
  });
});
