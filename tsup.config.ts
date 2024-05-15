import { defineConfig } from "tsup";

export default defineConfig({
    format: ["esm", "cjs"],
    entry: {
        client: "src/client/index.ts",
        server: "src/server/index.ts",
    },
    outDir: "dist",
    dts: true,
    sourcemap: true,
    clean: true,
});
