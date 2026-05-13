import path from "node:path";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(Deno.cwd()),
        path.join(Deno.cwd(), "../node_modules"),
      ],
    },
  },
});
