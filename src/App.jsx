// src/App.jsx
import React from "react";
import "./App.css";

export default function App() {
  return (
    <main className="page">
      <h1 className="page-title">自己紹介ページ</h1>

      <section className="card">
        <h2>氏名</h2>
        <p>日向野 方暉</p>
      </section>

      <section className="card">
        <h2>出身地</h2>
        <p>栃木県</p>
      </section>

      <section className="card">
        <h2>趣味</h2>
        <p>ランニング</p>
      </section>

      <section className="card">
        <h2>現在の仕事</h2>
        <p>金融機関</p>
      </section>
    </main>
  );
}
