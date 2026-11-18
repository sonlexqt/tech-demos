import { resolve } from "node:path";
import { defineConfig } from "vite";

const api = "http://127.0.0.1:8787";

export default defineConfig({
  appType: "mpa",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        editor: resolve(__dirname, "editor.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/oauth2": api,
      "/files": api,
      "/folders": api,
      "/users": api,
      "/api": api,
      "/open-with": api,
      "/2.0": api,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/oauth2": api,
      "/files": api,
      "/folders": api,
      "/users": api,
      "/api": api,
      "/open-with": api,
      "/2.0": api,
    },
  },
});
