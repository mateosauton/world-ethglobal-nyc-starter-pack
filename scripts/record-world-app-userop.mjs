import { readFile, writeFile } from "node:fs/promises";

const [userOpHash] = process.argv.slice(2);
const envPath = ".env.local";

if (!/^0x[0-9a-fA-F]{64}$/.test(userOpHash ?? "")) {
  console.error("Usage: pnpm release:record-userop 0x<64-hex-user-op-hash>");
  process.exit(1);
}

let contents;
try {
  contents = await readFile(envPath, "utf8");
} catch (error) {
  if (error.code === "ENOENT") {
    contents = "";
  } else {
    throw error;
  }
}

const line = `WORLD_APP_SEND_TRANSACTION_USEROP_HASH=${userOpHash}`;
if (/^WORLD_APP_SEND_TRANSACTION_USEROP_HASH=.*$/m.test(contents)) {
  contents = contents.replace(/^WORLD_APP_SEND_TRANSACTION_USEROP_HASH=.*$/m, line);
} else {
  if (contents && !contents.endsWith("\n")) {
    contents += "\n";
  }
  contents += `${line}\n`;
}

await writeFile(envPath, contents, { mode: 0o600 });
console.log("Recorded WORLD_APP_SEND_TRANSACTION_USEROP_HASH in .env.local.");
console.log("Run `pnpm release:external` to recheck the release gate.");
