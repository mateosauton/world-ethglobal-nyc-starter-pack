import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const outputPath = path.resolve("output/release-external-checks.json");
const WORLD_CHAIN_CONFIGS = {
  480: {
    name: "World Chain Mainnet",
    defaultRpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
    explorerBaseUrl: "https://worldscan.org"
  },
  4801: {
    name: "World Chain Sepolia",
    defaultRpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
    explorerBaseUrl: "https://sepolia.worldscan.org"
  }
};

const envFile = await readEnvFile(".env.local");
const env = { ...envFile.values, ...process.env };
const results = [];

record("env.local exists", envFile.exists, {
  path: ".env.local"
});

const appId = env.NEXT_PUBLIC_WORLD_APP_ID;
record("World app id configured", isConfigured(appId) && appId.startsWith("app_"), {
  variable: "NEXT_PUBLIC_WORLD_APP_ID"
});

const rpId = env.WORLD_RP_ID;
record("World RP id configured", isConfigured(rpId), {
  variable: "WORLD_RP_ID"
});

const rpSigningKey = env.WORLD_RP_SIGNING_KEY ?? env.WORLD_SIGNING_KEY;
record("World RP signing key configured", isPrivateKey(rpSigningKey), {
  variable: env.WORLD_RP_SIGNING_KEY ? "WORLD_RP_SIGNING_KEY" : "WORLD_SIGNING_KEY"
});

const defaultChainId = 4801;
const targetChainId = Number(env.NEXT_PUBLIC_WORLD_CHAIN_ID ?? defaultChainId);
const chainConfig = getWorldChainConfig(targetChainId);
record("World Chain target is supported", Boolean(chainConfig), {
  actual: targetChainId,
  supported: Object.keys(WORLD_CHAIN_CONFIGS).map(Number)
});

const rpcUrl =
  env.WORLD_CHAIN_RPC_URL ??
  chainConfig?.defaultRpcUrl ??
  WORLD_CHAIN_CONFIGS[defaultChainId].defaultRpcUrl;
const chainId = await getChainId(rpcUrl);
record("World Chain RPC reachable", Boolean(chainConfig) && chainId === targetChainId, {
  actual: chainId,
  expected: targetChainId,
  network: chainConfig?.name ?? "unknown",
  rpcUrl: redactUrl(rpcUrl)
});

const privateKey = env.PRIVATE_KEY;
const privateKeyOk = isPrivateKey(privateKey);
record("World Chain deployer private key configured", privateKeyOk, {
  variable: "PRIVATE_KEY"
});

const deployerAddress = privateKeyOk ? await getAddress(privateKey) : null;
const deployerBalance = deployerAddress ? await getBalance(rpcUrl, deployerAddress) : null;
record("World Chain deployer has ETH on target chain", Boolean(deployerBalance && deployerBalance > 0n), {
  address: deployerAddress,
  balanceWei: deployerBalance?.toString(),
  network: chainConfig?.name ?? "unknown"
});

const contractAddress = env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const contractAddressOk =
  isAddress(contractAddress) &&
  contractAddress.toLowerCase() !== "0x1111111111111111111111111111111111111111";
record("Claim contract address configured", contractAddressOk, {
  variable: "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS"
});

const contractCode = contractAddressOk ? await getCode(rpcUrl, contractAddress) : null;
record("Claim contract is deployed on target chain", Boolean(contractCode && contractCode !== "0x"), {
  address: contractAddress,
  network: chainConfig?.name ?? "unknown"
});

const portalKey = env.WORLD_DEVELOPER_API_KEY;
record("Developer Portal API key configured", isConfigured(portalKey) && portalKey.startsWith("api_"), {
  variable: "WORLD_DEVELOPER_API_KEY"
});

record("Developer Portal contract allowlist confirmed", env.PORTAL_CONTRACT_ALLOWLIST_CONFIRMED === "true", {
  variable: "PORTAL_CONTRACT_ALLOWLIST_CONFIRMED",
  expected: "true"
});

const userOpHash = env.WORLD_APP_SEND_TRANSACTION_USEROP_HASH;
record("World App sendTransaction user operation captured", /^0x[0-9a-fA-F]{64}$/.test(userOpHash ?? ""), {
  variable: "WORLD_APP_SEND_TRANSACTION_USEROP_HASH"
});

const explorerUrl = env.CONTRACT_EXPLORER_URL;
record("World Chain explorer link captured", explorerUrlMatchesTarget(explorerUrl, chainConfig), {
  variable: "CONTRACT_EXPLORER_URL",
  expectedBaseUrl: chainConfig?.explorerBaseUrl
});

const summary = {
  ok: results.every((result) => result.ok),
  results
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exit(1);
}

async function readEnvFile(filePath) {
  try {
    const contents = await readFile(filePath, "utf8");
    return {
      exists: true,
      values: Object.fromEntries(
        contents
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#") && line.includes("="))
          .map((line) => {
            const separator = line.indexOf("=");
            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
            return [key, value];
          })
      )
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { exists: false, values: {} };
    }
    throw error;
  }
}

function record(name, ok, details = {}) {
  results.push({ name, ok: Boolean(ok), details });
}

function isConfigured(value) {
  return Boolean(value && !value.includes("replace") && value !== "api_..." && value !== "0x...");
}

function isPrivateKey(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value ?? "") && !value.includes("replace");
}

function isAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(value ?? "");
}

function getWorldChainConfig(chainIdValue) {
  return WORLD_CHAIN_CONFIGS[chainIdValue] ?? null;
}

function explorerUrlMatchesTarget(value, config) {
  if (!config || !isConfigured(value)) {
    return false;
  }

  try {
    const actual = new URL(value);
    const expected = new URL(config.explorerBaseUrl);
    return actual.protocol === "https:" && actual.hostname === expected.hostname;
  } catch {
    return false;
  }
}

async function getAddress(privateKeyValue) {
  try {
    const { stdout } = await execFileAsync("cast", [
      "wallet",
      "address",
      "--private-key",
      privateKeyValue
    ]);
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getChainId(url) {
  const result = await rpc(url, "eth_chainId");
  return result ? Number(BigInt(result)) : null;
}

async function getBalance(url, address) {
  const result = await rpc(url, "eth_getBalance", [address, "latest"]);
  return result ? BigInt(result) : null;
}

async function getCode(url, address) {
  return rpc(url, "eth_getCode", [address, "latest"]);
}

async function rpc(url, method, params = []) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method,
        params
      })
    });
    const payload = await response.json();
    return payload.result ?? null;
  } catch {
    return null;
  }
}

function redactUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "invalid-url";
  }
}
