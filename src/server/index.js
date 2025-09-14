// src/server/index.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルを配信（client のビルド出力を配信）
app.use(express.static(path.join(__dirname, "../../dist/client")));

// 単純に index.html を返す
app.get("*", (req, res) => {
  const indexHtmlPath = path.join(__dirname, "../../dist/client/index.html");
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  res.status(200).set({ "Content-Type": "text/html" }).send(html);
});

app.listen(PORT, () => {
  console.log(`Static server listening at http://localhost:${PORT}`);
});
