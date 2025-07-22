import React, { useEffect, useState } from "react";

function DeviceStatus({ selectedPlant, updatesEnabled }) {
  const [status, setStatus] = useState({});
  const [modes, setModes] = useState({});
  const [intervalMs, setIntervalMs] = useState(3000);

  useEffect(() => {
    if (!updatesEnabled) return;
    let interval = setInterval(() => {
      fetch(`http://127.0.0.1:5000/device-status?plant=${selectedPlant}`)
        .then(res => res.json())
        .then(data => {
          setStatus(data.status || {});
          setModes(data.modes || {});
        });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [selectedPlant, intervalMs, updatesEnabled]);

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
        <span style={{fontSize: 22, marginLeft: 8}}>⚙️</span>
        <h4 style={{margin: 0, flex: 1}}>حالة الأجهزة ({selectedPlant})</h4>
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
          title="اختر كل كم ثانية يتم تحديث حالة الأجهزة"
        >
          <option value={3000}>3 ثوانٍ</option>
          <option value={10000}>10 ثوانٍ</option>
          <option value={30000}>30 ثانية</option>
          <option value={60000}>1 دقيقة</option>
        </select>
        <span style={{color: "#888"}}>؟</span>
      </label>
      <ul style={{marginTop: 12}}>
        {Object.entries(status).map(([device, state]) => (
          <li key={device}>
            {device}: <span style={{color: state ? "green" : "red"}}>{state ? "يعمل" : "متوقف"}</span>
            {" | "}
            <span style={{fontWeight: "bold"}}>
              الوضع: {modes[device] === "manual" ? "يدوي" : "أوتوماتيكي"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DeviceStatus;
