import { defineConfig } from "vite";
export default defineConfig({
  root: ".",
  base: "/",
  server: { open: true, port: 3000, strictPort: true, fs: { strict: false } },
  preview: { port: 3000, strictPort: true }
});
