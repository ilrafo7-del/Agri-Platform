import React, { useState } from "react";

function ModelExplanation() {
  const [explanation, setExplanation] = useState(null);

  const explain = () => {
    fetch("http://127.0.0.1:5000/explain-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_path: "data/processed/tomato_train.csv"
      })
    })
      .then(res => res.json())
      .then(data => setExplanation(data.explanation));
  };

  return (
    <div>
      <div style={{textAlign: "center", margin: 16}}>
        <button onClick={explain} style={{padding: "8px 24px", borderRadius: 8, background: "#388e3c", color: "#fff"}}>اشرح قرار النموذج</button>
      </div>
      {explanation && (
        <ul style={{direction: "rtl", fontSize: "1.1em"}}>
          {explanation.map((item, i) => (
            <li key={i}>
              <b>{item.feature}:</b> التأثير = {item.impact}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ModelExplanation;
