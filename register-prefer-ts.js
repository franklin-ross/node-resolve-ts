import { register } from "node:module";

register("./resolve-ts.js", import.meta.url, {
  data: {
    ".js": [".ts", ".js"],
    ".mjs": [".mts", ".mjs"],
    ".cjs": [".cts", ".cjs"],
  },
});
