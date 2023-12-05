import { cp, mkdir, writeFile } from "node:fs/promises";

const distEsm = new URL("../dist-esm/", import.meta.url);
const distCjs = new URL("../dist-cjs/", import.meta.url);

await mkdir(distEsm, { recursive: true });
await mkdir(distCjs, { recursive: true });
await Promise.all([
  writeFile(
    new URL("package.json", distEsm),
    JSON.stringify({ type: "module" }, null, "\t"),
  ),
  writeFile(
    new URL("package.json", distCjs),
    JSON.stringify({ type: "commonjs" }, null, "\t"),
  ),
  cp(
    new URL("../dist-esm/", import.meta.url),
    new URL("../dist-cjs/", import.meta.url),
    {
      recursive: true,
      preserveTimestamps: true,
      filter: (src) => {
        return src.endsWith(".d.ts") || src.endsWith("dist-esm");
      },
    },
  ),
]);
