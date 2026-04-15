import { describe, it, expect } from "vitest";
import { applyTransform } from "../test-utils";
import transform from "./jsx";

describe("wagmi jsx", () => {
  it("renames <WagmiConfig> → <WagmiProvider>", () => {
    const input = `const App = () => <WagmiConfig config={config}>{children}</WagmiConfig>;`;
    const output = `const App = () => <WagmiProvider config={config}>{children}</WagmiProvider>;`;
    expect(applyTransform(transform, input)).toBe(output);
  });

  it("does not touch unrelated JSX", () => {
    const input = `const App = () => <div className="app">{children}</div>;`;
    expect(applyTransform(transform, input)).toBe(input);
  });
});
