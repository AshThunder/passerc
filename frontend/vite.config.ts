import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath } from 'url';
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fhenixWasmFix = () => {
  return {
    name: "fhenix-wasm-fix",
    transform(code: string, id: string) {
      // Fix Wasm default import in fhenixjs
      if (id.includes("fhenixjs") && code.includes('import wasm from "./tfhe_bg')) {
        return {
          code: code.replace(/import wasm from "\.\/tfhe_bg(.*)\.wasm"/g, 'import * as wasm from "./tfhe_bg$1.wasm"'),
          map: null,
        };
      }
      // Fix tweetnacl-util "this is undefined" error
      if (id.includes("tweetnacl-util") && code.includes("}(this, function() {")) {
        return {
          code: code.replace("}(this, function() {", "}(typeof globalThis !== 'undefined' ? globalThis : window, function() {"),
          map: null,
        };
      }
      return null;
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills(),
    fhenixWasmFix()
  ],
  optimizeDeps: {
    include: ["tweetnacl"],
    exclude: ["fhenixjs", "cofhejs", "tfhe"]
  },
  resolve: {
    alias: {
      "wbg": path.resolve(__dirname, "node_modules/fhenixjs/lib/esm/sdk/fhe/tfhe_bg.js"),
    }
  }
})
