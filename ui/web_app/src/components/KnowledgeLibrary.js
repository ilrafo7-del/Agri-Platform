// components/KnowledgeLibrary.js
import React from "react";
const articles = [
  { title: "أفضل ممارسات الري", content: "ننصح بري النباتات في الصباح الباكر..." },
  { title: "كيفية تحسين جودة التربة", content: "استخدم السماد العضوي بانتظام..." }
];
function KnowledgeLibrary() {
  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>📚 مكتبة المعرفة الزراعية</div>
      <ul style={{direction: "rtl"}}>
        {articles.map((a, i) => (
          <li key={i} style={{marginBottom: 12}}>
            <b>{a.title}</b>
            <div style={{color: "#555"}}>{a.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default KnowledgeLibrary;
