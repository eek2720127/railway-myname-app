// server.js (ESM)
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express from "express";

const isProd = process.env.NODE_ENV === "production";
const resolve = (p) => path.resolve(p);

async function createServer() {
  const app = express();

  if (!isProd) {
    // 開発: Vite ミドルウェア（SSR モード）
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: "ssr" },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const mod = await vite.ssrLoadModule("/src/entry-server.jsx");
        const appHtml = mod.render(url);
        const html = template.replace("<!--ssr-outlet-->", appHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    // 本番: static client 提供 + server バンドルを dynamic import
    app.use(express.static(resolve("dist/client")));

    app.use("*", async (req, res) => {
      try {
        const template = fs.readFileSync(
          resolve("dist/client/index.html"),
          "utf-8"
        );
        const serverEntry = resolve("dist/server/entry-server.js"); // ビルド出力名に合わせる
        const { render } = await import(pathToFileURL(serverEntry).href);
        const appHtml = render(req.originalUrl);
        const html = template.replace("<!--ssr-outlet-->", appHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(
      `Server listening at http://localhost:${port} (prod=${isProd})`
    );
  });
}

createServer();
