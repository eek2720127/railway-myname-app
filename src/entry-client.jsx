// src/entry-client.jsx でこれに置き換え
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
createRoot(container).render(<App />);
