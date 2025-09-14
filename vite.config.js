// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // SWC ベースの React plugin

export default defineConfig({
  plugins: [react()],
  build: {
    // 必要なら出力先を分ける（デフォルトは dist）
    outDir: "dist/client",
  },
});
