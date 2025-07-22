import React, { useEffect, useState } from "react";

function SensorAlerts({ selectedPlant, updatesEnabled }) {
  const [alert, setAlert] = useState("");
  const [showToast, setShowToast] = useState(false);

  // مدة التحقق ثابتة (مثلاً كل دقيقة)
  const intervalMs = 60000;

  useEffect(() => {
    if (!updatesEnabled) return;
    let interval = setInterval(() => {
      fetch(`http://127.0.0.1:5000/live-sensor-data?plant=${selectedPlant}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const { temperature, humidity } = data.data;
            if (temperature > 35) setAlert("⚠️ درجة الحرارة مرتفعة جدًا!");
            else if (humidity < 30) setAlert("⚠️ الرطوبة منخفضة جدًا!");
            else setAlert("");
          }
        });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [selectedPlant, updatesEnabled]);

  useEffect(() => {
    if (alert) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div style={{direction: "rtl"}}>
      {showToast && alert && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "#ffdddd",
          color: "#b71c1c",
          padding: "12px 24px",
          borderRadius: 8,
          boxShadow: "0 2px 8px #eee",
          zIndex: 9999,
          fontWeight: "bold"
        }}>
          {alert}
        </div>
      )}
    </div>
  );
}

export default SensorAlerts;
