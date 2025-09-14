// server.js — production-ready SSR / dev server (Vite middleware for dev, static SSR for prod)
// Usage:
//  development: $env:NODE_ENV='development'; node server.js
//  production:  $env:NODE_ENV='production'; node server.js

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express from "express";

const isProd = process.env.NODE_ENV === "production";
const resolve = (p) => path.resolve(p);

async function createServer() {
  const app = express();

  if (!isProd) {
    // Development: use Vite as middleware (HMR + on-the-fly transform)
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

        // Load the server entry as ESM via Vite (reads source .jsx/.ts exactly)
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
    // Production: serve static client and call server bundle's render()
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

        // Find possible server bundle files (vite --ssr output or swc output)
        const candidates = [
          resolve("dist/server/entry-server.js"),
          resolve("dist/server/entry-server.mjs"),
          resolve("dist/server/entry-server.cjs"),
          resolve("dist/server/index.js"),
        ];

        let serverEntry = candidates.find((p) => fs.existsSync(p));
        if (!serverEntry) {
          return res
            .status(500)
            .send("Server bundle not found. Run SSR build (vite --ssr).");
        }

        // Import server bundle as ESM using file:// URL
        const mod = await import(pathToFileURL(serverEntry).href);
        const render = mod?.render ?? mod?.default?.render ?? mod?.default;
        if (typeof render !== "function") {
          console.error(
            "Loaded server module did not export a render function. Module keys:",
            Object.keys(mod)
          );
          return res
            .status(500)
            .send("server bundle does not export render(url) function.");
        }

        const appHtml = render(req.originalUrl);

        // Remove client-side <script type="module"> injected by Vite so we don't hydrate
        const withoutScript = template.replace(
          /<script\b[^>]*type=(?:"|')module(?:"|')[^<]*<\/script>/gi,
          ""
        );

        const html = withoutScript.replace(
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

  // Start server and handle EADDRINUSE gracefully
  const server = app.listen(port, () => {
    console.log(
      `Server listening at http://localhost:${port} (prod=${isProd})`
    );
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. If this is unexpected, find and stop the process or set PORT env var.`
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
