import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const knownExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json"]);
const hasKnownExtension = (specifier) => knownExtensions.has(path.extname(specifier));
const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");

export async function resolve(specifier, context, defaultResolve) {
  if (!isRelative(specifier) || hasKnownExtension(specifier) || context.parentURL === undefined) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  const parentPath = fileURLToPath(context.parentURL);
  const basePath = path.resolve(path.dirname(parentPath), specifier);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return defaultResolve(pathToFileURL(candidate).href, context, defaultResolve);
    } catch {
      // Try the next candidate.
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
