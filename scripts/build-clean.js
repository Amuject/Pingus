import { rm } from "node:fs/promises";

await rm(new URL("../dist-esm", import.meta.url), {
  recursive: true,
  force: true,
});
await rm(new URL("../dist-cjs", import.meta.url), {
  recursive: true,
  force: true,
});
