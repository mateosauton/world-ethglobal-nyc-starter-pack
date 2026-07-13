import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const stub = (name: string) => fileURLToPath(new URL(`./src/test-stubs/${name}.tsx`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "class-variance-authority": stub("class-variance-authority"),
      clsx: stub("clsx"),
      "lucide-react": stub("lucide-react"),
      "radix-ui": stub("radix-ui"),
      "tailwind-merge": stub("tailwind-merge"),
    },
  },
})
