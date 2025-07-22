import React, { useState } from "react";

function ControlPanel({ selectedPlant }) {
  const [status, setStatus] = useState({});
  const [modes, setModes] = useState({});
  const [message, setMessage] = useState("");

  // جلب الحالة والوضع عند تغيير النبتة
  React.useEffect(() => {
    fetch(`http://127.0.0.1:5000/device-status?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.status || {});
        setModes(data.modes || {});
      });
  }, [selectedPlant]);

  // تغيير وضع الجهاز
  const handleModeChange = (device, mode) => {
    fetch("http://127.0.0.1:5000/set-device-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant: selectedPlant, device, mode })
    })
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setModes(m => ({ ...m, [device]: mode }));
      });
  };

  // التحكم اليدوي في الجهاز
  const handleControl = (device, action) => {
    fetch("http://127.0.0.1:5000/control-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant: selectedPlant, device, action })
    })
      .then(res => res.json())
      .then(data => setMessage(data.message));
  };

  return (
    <div style={{margin: "20px 0", background: "#f9f9f9", padding: 16, borderRadius: 8}}>
      <h4 style={{textAlign: "center"}}>لوحة التحكم ({selectedPlant})</h4>
      <div style={{textAlign: "center"}}>
        {["pump", "fan"].map(device => (
          <div key={device} style={{marginBottom: 12, display: "inline-block", minWidth: 250}}>
            <b>{device === "pump" ? "المضخة" : "المروحة"}:</b>
            {" "}
            <select
              value={modes[device] || "auto"}
              onChange={e => handleModeChange(device, e.target.value)}
              style={{marginLeft: 8}}
            >
              <option value="auto">أوتوماتيكي</option>
              <option value="manual">يدوي</option>
            </select>
            {" "}
            <button
              onClick={() => handleControl(device, "on")}
              disabled={modes[device] !== "manual"}
              style={{marginLeft: 8}}
            >تشغيل</button>
            <button
              onClick={() => handleControl(device, "off")}
              disabled={modes[device] !== "manual"}
              style={{marginLeft: 8}}
            >إيقاف</button>
          </div>
        ))}
      </div>
      {message && <div style={{color: "green", marginTop: 8, textAlign: "center"}}>{message}</div>}
    </div>
  );
}

export default ControlPanel;
