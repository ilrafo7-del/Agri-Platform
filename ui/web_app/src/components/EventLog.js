import React, { useEffect, useState } from "react";

function EventLog({ selectedPlant, updatesEnabled }) {
  const [log, setLog] = useState([]);
  const [intervalMs, setIntervalMs] = useState(60000); // 1 دقيقة افتراضيًا

  useEffect(() => {
    if (!updatesEnabled) return;
    let interval = setInterval(() => {
      fetch("http://127.0.0.1:5000/event-log")
        .then(res => res.json())
        .then(data => setLog(data.log || []));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, updatesEnabled]);

  return (
    <div style={{
      margin: "20px 0",
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px #eee",
      padding: 16,
      direction: "rtl"
    }}>
      <div style={{display: "flex", alignItems: "center", marginBottom: 8}}>
        <span style={{fontSize: 22, marginLeft: 8}}>📜</span>
        <h4 style={{margin: 0, flex: 1}}>سجل الأحداث</h4>
        <span title={updatesEnabled ? "التحديث نشط" : "التحديث متوقف"} style={{fontSize: 20}}>
          {updatesEnabled ? "🟢" : "🔴"}
        </span>
      </div>
      <label>
        مدة التحديث:
        <select
          value={intervalMs}
          onChange={e => setIntervalMs(Number(e.target.value))}
          style={{margin: "0 8px"}}
          title="اختر كل كم دقيقة يتم تحديث سجل الأحداث"
        >
          <option value={60000}>1 دقيقة</option>
          <option value={300000}>5 دقائق</option>
          <option value={600000}>10 دقائق</option>
        </select>
        <span style={{color: "#888"}}>؟</span>
      </label>
      <ul style={{marginTop: 12}}>
        {log
          .filter(e => e.plant === selectedPlant)
          .map((e, i) => (
            <li key={i}>
              [{e.time.split("T")[1].split(".")[0]}] {e.device} ← {e.action}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default EventLog;
