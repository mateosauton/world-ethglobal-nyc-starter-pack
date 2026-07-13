import { readdir, readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const DEMOS = [
  "one-human-trial",
  "selfie-onboarding",
  "agentkit-x402",
  "credential-policy-lab",
]

const OBSOLETE_APPS = [
  "human-agent-console",
  "human-approval-desk",
  "human-gated-claim",
  "ui-test-bench",
]

const COPY_RULES = [
  ["ETHGlobal NYC", /ETHGlobal\s+NYC/gi],
  ["Track A/B/C", /\bTrack\s+[ABC]\b/gi],
  ["MiniKit verification", /MiniKit\s+verification/gi],
  ["orbLegacy", /\borbLegacy\b/gi],
]

const COPY_EXTENSIONS = new Set([".js", ".jsx", ".md", ".mjs", ".ts", ".tsx"])
const IGNORED_DIRECTORIES = new Set([".next", ".vercel", "node_modules", "superpowers", "tests"])

async function listReleaseFiles(directory) {
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    if (IGNORED_DIRECTORIES.has(entry.name) || entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      files.push(...await listReleaseFiles(join(directory, entry.name)))
    } else if (!entry.name.endsWith(".tsbuildinfo")) {
      files.push(join(directory, entry.name))
    }
  }

  return files
}

async function listCopyFiles(directory) {
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...await listCopyFiles(join(directory, entry.name)))
      }
    } else if (COPY_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(directory, entry.name))
    }
  }

  return files
}

export async function scanLisbonRelease(rootDirectory) {
  const root = resolve(rootDirectory)
  const violations = []
  const publicApps = []
  const readmePath = join(root, "README.md")
  const readme = await readFile(readmePath, "utf8").catch(() => "")

  for (const entry of await readdir(join(root, "apps"), { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue
    const manifest = join(root, "apps", entry.name, "package.json")
    if (await readFile(manifest, "utf8").then(() => true).catch(() => false)) {
      publicApps.push(entry.name)
    }
  }

  const demos = DEMOS.filter((demo) => publicApps.includes(demo))
  const unexpectedApps = publicApps.filter((app) => !DEMOS.includes(app))
  const missingApps = DEMOS.filter((app) => !publicApps.includes(app))

  for (const app of [...OBSOLETE_APPS.filter((app) => publicApps.includes(app)), ...unexpectedApps]) {
    violations.push(`Unexpected public app manifest: apps/${app}/package.json`)
  }
  for (const app of missingApps) {
    violations.push(`Missing Lisbon demo manifest: apps/${app}/package.json`)
  }
  for (const app of OBSOLETE_APPS) {
    const leftovers = await listReleaseFiles(join(root, "apps", app))
    if (leftovers.length > 0) {
      violations.push(`Obsolete app still contains public files: apps/${app}`)
    }
  }
  for (const app of DEMOS) {
    if (!readme.includes(`apps/${app}`)) {
      violations.push(`README.md does not list apps/${app}`)
    }
  }

  const copyFiles = [readmePath]
  copyFiles.push(...await listCopyFiles(join(root, "docs")))
  for (const demo of DEMOS) {
    copyFiles.push(...await listCopyFiles(join(root, "apps", demo)))
  }

  for (const file of copyFiles) {
    const content = await readFile(file, "utf8").catch(() => "")
    for (const [label, pattern] of COPY_RULES) {
      pattern.lastIndex = 0
      if (pattern.test(content)) {
        violations.push(`${relative(root, file)} contains forbidden public copy: ${label}`)
      }
    }
  }

  return {
    ok: violations.length === 0,
    demos,
    checkedFiles: [...new Set(copyFiles)].length,
    violations,
  }
}

async function runCli() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const report = await scanLisbonRelease(root)
  const outputPath = join(root, "output", "lisbon-release-check.json")
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)

  if (report.ok) {
    console.log(`Lisbon release check passed: ${report.demos.length} demos, ${report.checkedFiles} files scanned.`)
    return
  }

  console.error(`Lisbon release check failed with ${report.violations.length} violation(s):`)
  for (const violation of report.violations) console.error(`- ${violation}`)
  process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await runCli()
}
