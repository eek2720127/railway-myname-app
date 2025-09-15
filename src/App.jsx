// src/App.jsx
import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

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

        <div style={{ marginTop: 12 }}>
          <button onClick={() => setCount((c) => c + 1)}>
            今日のランニング回数: {count}
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <button onClick={() => setOpen((v) => !v)}>
            {open ? "サイドバーを閉じる" : "サイドバーを開く"}
          </button>
          {open && (
            <div style={{ marginTop: 8, padding: 8, border: "1px solid #ddd" }}>
              <p>河川敷を走るのが好きです。</p>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h2>現在の仕事</h2>
        <p>金融機関</p>
      </section>
    </main>
  );
}
