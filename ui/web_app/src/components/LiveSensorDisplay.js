import React, { useEffect, useState } from "react";

const sensorLabels = {
  temperature: "درجة الحرارة",
  humidity: "الرطوبة",
  ph_level: "pH",
  light_intensity: "شدة الإضاءة"
};

function LiveSensorDisplay({ selectedPlant, updatesEnabled }) {
  const [sensorData, setSensorData] = useState(null);
  const [sensorStates, setSensorStates] = useState({});
  const [intervalMs, setIntervalMs] = useState(3000);

  // جلب القيم الحية
  useEffect(() => {
    if (!updatesEnabled) return;
    let interval = setInterval(() => {
      fetch(`http://127.0.0.1:5000/live-sensor-data?plant=${selectedPlant}`)
        .then(res => res.json())
        .then(data => setSensorData(data.data));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [selectedPlant, updatesEnabled, intervalMs]);

  // جلب حالة المستشعرات
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/sensor-status?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => setSensorStates(data.status || {}));
  }, [selectedPlant]);

  // تفعيل/إيقاف مستشعر
  const toggleSensor = (sensor, state) => {
    fetch("http://127.0.0.1:5000/toggle-sensor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant: selectedPlant, sensor, state })
    })
      .then(res => res.json())
      .then(() => {
        setSensorStates(s => ({ ...s, [sensor]: state }));
      });
  };

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
        <span style={{fontSize: 22, marginLeft: 8}}>🌡️</span>
        <h4 style={{margin: 0, flex: 1}}>القيم الحية للمستشعرات ({selectedPlant})</h4>
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
          title="اختر كل كم ثانية يتم تحديث القيم الحية"
        >
          <option value={3000}>3 ثوانٍ</option>
          <option value={10000}>10 ثوانٍ</option>
          <option value={30000}>30 ثانية</option>
          <option value={60000}>1 دقيقة</option>
        </select>
        <span style={{color: "#888"}}>؟</span>
      </label>
      <ul style={{marginTop: 12}}>
        {Object.keys(sensorLabels).map(sensor => (
          <li key={sensor} style={{marginBottom: 8}}>
            <b>{sensorLabels[sensor]}:</b>{" "}
            {sensorStates[sensor] === false
              ? <span style={{color: "gray"}}>غير مفعل</span>
              : sensorData && sensorData[sensor] !== undefined
                ? <span>{sensorData[sensor]}</span>
                : <span>--</span>
            }
            {" "}
            <button
              style={{
                marginRight: 8,
                background: sensorStates[sensor] ? "#f44336" : "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "2px 10px",
                fontSize: 13
              }}
              onClick={() => toggleSensor(sensor, !sensorStates[sensor])}
            >
              {sensorStates[sensor] ? "إيقاف" : "تفعيل"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LiveSensorDisplay;
