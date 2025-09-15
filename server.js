// server.js — dev/prod 両対応の SSR サーバ（Hydration 対応）
// Usage:
//   開発:  $env:NODE_ENV='development'; node server.js
//   本番:  $env:NODE_ENV='production';  node server.js

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express from "express";

const isProd = process.env.NODE_ENV === "production";
const resolve = (p) => path.resolve(p);

async function createServer() {
  const app = express();

  if (!isProd) {
    // 開発モード: Vite ミドルウェアで SSR（HMR が使える）
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: "ssr" },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);

        // 開発時はソースの entry-server をそのまま読み込む
        const mod = await vite.ssrLoadModule("/src/entry-server.jsx");
        const render = mod?.render ?? mod?.default?.render ?? mod?.default;
        if (typeof render !== "function") {
          throw new Error("render() not found in server module (dev)");
        }

        const appHtml = render(url);
        const html = template.replace(
          "<!--ssr-outlet-->",
          `<div id="root">${appHtml}</div>`
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error("SSR dev error:", e);
        res.status(500).end(e.message || String(e));
      }
    });
  } else {
    // 本番モード: dist/client を static 配信し、server バンドルの render() を呼ぶ
    const clientDist = resolve("dist/client");
    app.use(express.static(clientDist, { index: false }));

    app.get("*", async (req, res) => {
      try {
        const templatePath = resolve("dist/client/index.html");
        if (!fs.existsSync(templatePath)) {
          return res
            .status(500)
            .send("Dist client index.html not found. Run client build.");
        }

        const template = fs.readFileSync(templatePath, "utf-8");

        // SSR バンドルの候補を探索（Vite の --ssr 出力など）
        const candidates = [
          resolve("dist/server/entry-server.js"),
          resolve("dist/server/entry-server.mjs"),
          resolve("dist/server/entry-server.cjs"),
          resolve("dist/server/index.js"),
        ];

        const serverEntry = candidates.find((p) => fs.existsSync(p));
        if (!serverEntry) {
          return res
            .status(500)
            .send("Server bundle not found. Run SSR build (vite --ssr).");
        }

        // file:// URL を使って ESM インポート
        const mod = await import(pathToFileURL(serverEntry).href);
        const render = mod?.render ?? mod?.default?.render ?? mod?.default;
        if (typeof render !== "function") {
          console.error(
            "Loaded server module did not export a render function. Module keys:",
            Object.keys(mod)
          );
          return res
            .status(500)
            .send("Server bundle does not export render(url) function.");
        }

        const appHtml = render(req.originalUrl);

        // 重要: 本番でも client の <script type="module"> を削除しない（Hydration のために残す）
        // そのままテンプレートに SSR 出力を埋め込む
        const html = template.replace(
          "<!--ssr-outlet-->",
          `<div id="root">${appHtml}</div>`
        );

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        console.error("SSR prod error:", e);
        res.status(500).end(e.message || String(e));
      }
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // サーバ起動（EADDRINUSE をハンドル）
  const server = app.listen(port, () => {
    console.log(
      `Server listening at http://localhost:${port} (prod=${isProd})`
    );
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Set PORT env var or stop the running process.`
      );
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

createServer().catch((err) => {
  console.error("Failed to create server:", err);
  process.exit(1);
});
