import { rm } from "node:fs/promises";

await rm(new URL("../test/node_modules", import.meta.url), {
  recursive: true,
  force: true,
});
await rm(new URL("../test/package-lock.json", import.meta.url), {
  force: true,
});
