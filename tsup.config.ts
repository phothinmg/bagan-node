import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/fs/index.ts"],
  splitting: true,
  sourcemap: true,
  format: ["esm", "cjs"],
  dts: true,
  outDir: "./dist/fs",
  treeshake: true,
  shims: true,
});
