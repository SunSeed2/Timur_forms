import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";

const envCandidates = [".env.development.local", ".env.local", ".env"];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    process.loadEnvFile?.(envPath);
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
