import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.resolve(process.cwd(), "next-env.d.ts");
const stableContents = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is kept stable so \`pnpm typecheck\` works before the first dev/build run.

`;

try {
  const current = await readFile(target, "utf8");
  if (current !== stableContents) {
    await writeFile(target, stableContents);
  }
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}
