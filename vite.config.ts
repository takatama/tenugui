import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    {
      name: "tenugui-service-worker-version",
      apply: "build",
      generateBundle() {
        if (this.environment.name !== "client") return;
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: readFileSync(new URL("./public/sw.js", import.meta.url), "utf8")
            .replace("__TENUGUI_BUILD_VERSION__", Date.now().toString(36)),
        });
      },
    },
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
