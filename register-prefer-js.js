import { register } from "node:module";

register("./resolve-ts.js", import.meta.url, {
  data: {
    ".js": [".js", ".ts"],
    ".mjs": [".mjs", ".mts"],
    ".cjs": [".cjs", ".cts"],
  },
});
