import { useState } from "react";
import "./App.css";

function App() {
  const [runCount, setRunCount] = useState(0);

  return (
    <main>
      <h1>自己紹介ページ</h1>

      <section>
        <h2>氏名</h2>
        <p>日向野 方暉</p>
      </section>

      <section>
        <h2>出身地</h2>
        <p>栃木県</p>
      </section>

      <section>
        <h2>趣味</h2>
        <p>ランニング</p>
        <button onClick={() => setRunCount(runCount + 1)}>
          今日のランニング回数: {runCount}
        </button>
      </section>

      <section>
        <h2>現在の仕事</h2>
        <p>金融機関</p>
      </section>
    </main>
  );
}

export default App;
