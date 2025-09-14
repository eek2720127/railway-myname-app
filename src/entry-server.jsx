// src/entry-server.jsx
import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

// render(url) を export してサーバが呼べる形にする
export function render(url) {
  // 必要ならここでルーティングやデータ取得 (sync) を入れる
  // renderToString で HTML の断片を返す（root 要素は server.js 側で付ける）
  return renderToString(<App />);
}
