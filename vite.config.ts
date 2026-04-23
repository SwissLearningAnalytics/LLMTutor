// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import ViteYaml from "@modyfi/vite-plugin-yaml";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart({ customViteReactPlugin: true, target: "node-server" }),
    viteReact(),
    ViteYaml(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
