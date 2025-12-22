// Must be the first import
import "preact/debug";

// Or if you just want the devtools bridge (~240B) without other
// debug code (useful for production sites)
import "preact/devtools";

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
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
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
