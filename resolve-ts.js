import { stat } from "node:fs/promises";
import { resolve as resolvePath, dirname, extname } from "node:path";
import { pathToFileURL } from "node:url";

/** @type {Record<string, string[]>} */
let extensionMap = {};

/**
 * Initialises the extension mappings when these hooks are registered.
 * @param {typeof extensionMap} extMap An object mapping from import extension
 * to the ordered list of extensions to try resolving instead.
 * @example
 * register("./resolve-ts.js", import.meta.url, {
 *   // Prefer .ts files when available but fall back to .js
 *   data: {
 *     ".js": [".ts", ".js"],
 *     ".mjs": [".mts", ".mjs"],
 *     ".cjs": [".cts", ".cjs"],
 *   },
 * });
 */
export function initialize(extMap) {
  if (extMap) {
    extensionMap = extMap;
  }
}

/**
 * NodeJS hook to resolve different file extensions for imports based on the
 * extension map.
 *
 * Supports `node --experimental-strip-types` where ESM needs extensions and TS
 * expects you to use `.js` extensions, which Node will fail to resolve.
 * @type {import("node:module").ResolveHook}
 */
export async function resolve(specifier, context, nextResolve) {
  const { parentURL } = context;

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const ext = extname(specifier);
    const candidateExts = extensionMap[ext];

    if (candidateExts) {
      const resolved = await resolveFileWithExtensions(
        specifier.slice(0, specifier.length - ext.length),
        parentURL ? new URL(parentURL).pathname : ".",
        candidateExts
      );
      if (resolved) {
        return {
          shortCircuit: true,
          url: resolved,
        };
      }
    }
  }

  // Fallback to default behavior if not matched
  return nextResolve(specifier, context);
}

/** Attempts to resolve the file using specified extensions.
 * @param {string} specifierWithoutExt The module specifier without extension
 * @param {string} parentPath The path from which the module is
 * imported.
 * @param {string[]} extensions The ordered list of extensions to check.
 * @returns {Promise<string | undefined>} The resolved file URL, or undefined
 * if not found.
 */
async function resolveFileWithExtensions(
  specifierWithoutExt,
  parentPath,
  extensions
) {
  const parentDir = dirname(parentPath);
  const resolvedPathWithoutExt = resolvePath(parentDir, specifierWithoutExt);

  const candidates = await Promise.allSettled(
    extensions.map((ext) => stat(resolvedPathWithoutExt + ext))
  );

  let candidate;
  for (let i = 0; i < candidates.length; ++i) {
    candidate = candidates[i];
    if (candidate.status === "fulfilled" && candidate.value.isFile()) {
      return pathToFileURL(resolvedPathWithoutExt + extensions[i]).href;
    }
  }

  return undefined;
}
