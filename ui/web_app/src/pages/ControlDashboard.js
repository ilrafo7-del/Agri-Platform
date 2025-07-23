import React, { useState, useEffect } from "react";
import LiveSensorDisplay from "../components/LiveSensorDisplay";
import SensorAlerts from "../components/SensorAlerts";
import DeviceStatus from "../components/DeviceStatus";
import EventLog from "../components/EventLog";
import ControlPanel from "../components/ControlPanel";
import AgriAssistantChat from "../components/AgriAssistantChat";
import WeeklyReport from "../components/WeeklyReport";
import EnvironmentalImpact from "../components/EnvironmentalImpact";

const plants = [
  { value: "tomato", label: "الطماطم 🍅" },
  { value: "cucumber", label: "الخيار 🥒" },
  { value: "pepper", label: "الفلفل 🌶️" }
];

function ControlDashboard({ updatesEnabled, setUpdatesEnabled }) {
  const [selectedPlant, setSelectedPlant] = useState("tomato");
  const [faultRisk, setFaultRisk] = useState({pump: null, fan: null});
  const [deviceStatus, setDeviceStatus] = useState({});
  const [deviceHealth, setDeviceHealth] = useState({});

  const API_URL = process.env.REACT_APP_API_URL;

  // جلب بيانات الأعطال والصحة
  useEffect(() => {
    ["pump", "fan"].forEach(device => {
      fetch(`${API_URL}/predict-fault`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({plant: selectedPlant, device})
      })
        .then(res => res.json())
        .then(data => setFaultRisk(risk => ({...risk, [device]: data.fault_risk})));
    });
  }, [selectedPlant, updatesEnabled]);

  useEffect(() => {
    fetch(`${API_URL}/device-status?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => setDeviceStatus(data));
  }, [selectedPlant, updatesEnabled]);

  useEffect(() => {
    fetch(`${API_URL}/device-health?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => setDeviceHealth(data.health || {}));
  }, [selectedPlant, updatesEnabled]);

  // تجميع التنبيهات الذكية
  const deviceAlerts = [];
  if (deviceHealth.pump !== undefined && deviceHealth.pump <= 40) {
    deviceAlerts.push({
      device: "المضخة",
      message: "⚠️ صحة المضخة منخفضة. يُنصح بإجراء صيانة وقائية قريبًا.",
      color: "#d32f2f"
    });
  }
  if (deviceHealth.fan !== undefined && deviceHealth.fan <= 40) {
    deviceAlerts.push({
      device: "المروحة",
      message: "⚠️ صحة المروحة منخفضة. يُنصح بإجراء صيانة وقائية قريبًا.",
      color: "#d32f2f"
    });
  }
  if (faultRisk.pump === 1) {
    deviceAlerts.push({
      device: "المضخة",
      message: "🚨 الذكاء الاصطناعي: احتمال مرتفع لعطل وشيك في المضخة!",
      color: "#b71c1c"
    });
  }
  if (faultRisk.fan === 1) {
    deviceAlerts.push({
      device: "المروحة",
      message: "🚨 الذكاء الاصطناعي: احتمال مرتفع لعطل وشيك في المروحة!",
      color: "#b71c1c"
    });
  }

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa", padding: 24}}>
      <div style={{
        maxWidth: 950,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}>
        {/* شريط اختيار النبتة والتحكم بالتحديث */}
        <div style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "center"
        }}>
          <select
            value={selectedPlant}
            onChange={e => setSelectedPlant(e.target.value)}
            style={{
              fontSize: "1.1rem",
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff"
            }}
          >
            {plants.map(plant => (
              <option key={plant.value} value={plant.value}>{plant.label}</option>
            ))}
          </select>
          <button
            onClick={() => setUpdatesEnabled(e => !e)}
            style={{
              background: updatesEnabled ? "#f44336" : "#4caf50",
              color: "#fff",
              padding: "10px 24px",
              border: "none",
              borderRadius: 8,
              fontSize: "1.1rem",
              fontWeight: "bold",
              boxShadow: "0 2px 8px #0001"
            }}
          >
            {updatesEnabled ? "إيقاف التحديثات الدورية" : "تشغيل التحديثات الدورية"}
          </button>
        </div>

        {/* التنبيهات الذكية */}
        {deviceAlerts.length > 0 && (
          <div style={{
            background: "#fff3e0",
            borderRadius: 10,
            padding: "14px 22px",
            boxShadow: "0 1px 6px #0001",
            direction: "rtl"
          }}>
            <div style={{fontWeight: "bold", color: "#d84315", marginBottom: 6, fontSize: "1.08rem"}}>
              🔔 تنبيهات الأجهزة الذكية
            </div>
            <ul style={{margin: 0, padding: 0, listStyle: "none"}}>
              {deviceAlerts.map((alert, idx) => (
                <li key={idx} style={{
                  color: alert.color,
                  fontWeight: "bold",
                  marginBottom: 6,
                  fontSize: "1.04rem"
                }}>
                  <span style={{marginLeft: 8}}>{alert.device}:</span> {alert.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* القيم الحية للمستشعرات */}
        <div className="main-card">
          <div className="section-title"><span>🌡️</span> القيم الحية للمستشعرات</div>
          <LiveSensorDisplay selectedPlant={selectedPlant} updatesEnabled={updatesEnabled} />
        </div>

        {/* التحكم في الأجهزة وحالتها */}
        <div className="main-card">
          <div className="section-title"><span>⚙️</span> حالة الأجهزة والتحكم</div>
          <ControlPanel selectedPlant={selectedPlant} />
          <DeviceStatus selectedPlant={selectedPlant} updatesEnabled={updatesEnabled} />
        </div>

        {/* صحة الأجهزة */}
        <div className="main-card" style={{background: "#f7fafd"}}>
          <div className="section-title" style={{textAlign: "center", fontSize: "1.2rem", marginBottom: 16}}>
            🩺 <b>مؤشر صحة الأجهزة</b>
          </div>
          <div style={{display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap"}}>
            {/* بطاقة المضخة */}
            <div style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 6px #0001",
              padding: 18,
              minWidth: 220,
              textAlign: "center",
              border: deviceHealth.pump > 70 ? "2px solid #388e3c"
                    : deviceHealth.pump > 40 ? "2px solid #fbc02d"
                    : "2px solid #d32f2f"
            }}>
              <div style={{fontSize: "2.2rem"}}>💧</div>
              <div style={{fontWeight: "bold", fontSize: "1.1rem"}}>المضخة</div>
              <div style={{
                fontSize: "1.5rem",
                color: deviceHealth.pump > 70 ? "#388e3c"
                    : deviceHealth.pump > 40 ? "#fbc02d"
                    : "#d32f2f",
                fontWeight: "bold"
              }}>
                {deviceHealth.pump !== undefined ? `${deviceHealth.pump}%` : "—"}
              </div>
              <div style={{fontSize: "0.98rem", margin: "6px 0"}}>
                {deviceHealth.pump > 70 && "الحالة ممتازة"}
                {deviceHealth.pump <= 70 && deviceHealth.pump > 40 && "الحالة متوسطة"}
                {deviceHealth.pump <= 40 && "⚠️ تحتاج صيانة قريبًا"}
              </div>
            </div>
            {/* بطاقة المروحة */}
            <div style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 6px #0001",
              padding: 18,
              minWidth: 220,
              textAlign: "center",
              border: deviceHealth.fan > 70 ? "2px solid #388e3c"
                    : deviceHealth.fan > 40 ? "2px solid #fbc02d"
                    : "2px solid #d32f2f"
            }}>
              <div style={{fontSize: "2.2rem"}}>🌀</div>
              <div style={{fontWeight: "bold", fontSize: "1.1rem"}}>المروحة</div>
              <div style={{
                fontSize: "1.5rem",
                color: deviceHealth.fan > 70 ? "#388e3c"
                    : deviceHealth.fan > 40 ? "#fbc02d"
                    : "#d32f2f",
                fontWeight: "bold"
              }}>
                {deviceHealth.fan !== undefined ? `${deviceHealth.fan}%` : "—"}
              </div>
              <div style={{fontSize: "0.98rem", margin: "6px 0"}}>
                {deviceHealth.fan > 70 && "الحالة ممتازة"}
                {deviceHealth.fan <= 70 && deviceHealth.fan > 40 && "الحالة متوسطة"}
                {deviceHealth.fan <= 40 && "⚠️ تحتاج صيانة قريبًا"}
              </div>
            </div>
          </div>
        </div>

        {/* التقارير */}
        <div style={{display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center"}}>
          <WeeklyReport selectedPlant={selectedPlant} />
          <EnvironmentalImpact selectedPlant={selectedPlant} />
        </div>

        {/* سجل الأحداث */}
        <div className="main-card">
          <div className="section-title"><span>📜</span> سجل الأحداث</div>
          <EventLog selectedPlant={selectedPlant} updatesEnabled={updatesEnabled} />
        </div>

        {/* تنبيهات المستشعرات */}
        <SensorAlerts selectedPlant={selectedPlant} updatesEnabled={updatesEnabled} />

        {/* مساعد زراعي افتراضي */}
        <AgriAssistantChat />
      </div>
    </div>
  );
}

export default ControlDashboard;
