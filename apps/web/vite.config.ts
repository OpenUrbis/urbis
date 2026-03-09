import preact from "@preact/preset-vite";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    preact({
      babel: {
        plugins: [["module:@preact/signals-react-transform"]],
      },
    }),
  ],
  resolve: {
    dedupe: [
      "preact",
      "preact/compat",
      "react",
      "react-dom",
      "@preact/signals-core",
      "@preact/signals-react",
    ],
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/compat/jsx-runtime",
      fs: path.resolve(__dirname, "./src/stubs/fs.js"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
});
