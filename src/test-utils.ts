import jscodeshift, { type API, type FileInfo } from "jscodeshift";
import type { Transform } from "jscodeshift";

export function applyTransform(
  transform: Transform,
  source: string,
  options: Record<string, unknown> = {}
): string {
  const fileInfo: FileInfo = { path: "test.ts", source };
  const api: API = {
    j: jscodeshift.withParser("tsx"),
    jscodeshift: jscodeshift.withParser("tsx"),
    stats: () => {},
    report: () => {},
  };

  const result = transform(fileInfo, api, options);
  return typeof result === "string" ? result : source;
}
