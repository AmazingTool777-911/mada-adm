import path from "node:path";
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    fs: {
      allow: [path.join(Deno.cwd(), "..")],
    },
  },
  envDir: path.join(Deno.cwd(), ".."),
  resolve: {
    alias: [
      {
        find: /^@babel\/runtime\/helpers\/(?!esm\/)(.*)$/,
        replacement: "@babel/runtime/helpers/esm/$1",
      },
    ],
  },
});
