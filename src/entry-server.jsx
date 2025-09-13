import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

// 簡易的に render(url) を提供
export function render(url) {
  // 必要ならここでルーティングやデータ取得を入れる
  return renderToString(<App />);
}
