// src/entry-client.jsx
import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (container) {
  // hydrateRoot を使ってサーバレンダリング済みの DOM に React を「水和」する
  hydrateRoot(container, <App />);
  console.log("Client: hydrated");
} else {
  console.warn("Client: root container not found");
}
