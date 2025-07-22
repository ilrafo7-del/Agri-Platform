import React, { useState } from "react";

// مثال لقيم افتراضية للمستشعرات
const initialSensors = [
  { name: "درجة الحرارة", key: "temperature", value: 25, unit: "°C" },
  { name: "الرطوبة", key: "humidity", value: 60, unit: "%" },
  { name: "شدة الإضاءة", key: "light", value: 300, unit: "lux" },
  { name: "الرقم الهيدروجيني", key: "ph", value: 6.5, unit: "" }
];

function SensorsSection() {
  const [sensors, setSensors] = useState(initialSensors);
  const [decision, setDecision] = useState("");
  const [conflict, setConflict] = useState(false);

  // محاكاة قراءة القيم من المستشعرات
  const readSensors = () => {
    // توليد قيم عشوائية لمحاكاة الارتباك
    const newSensors = sensors.map(sensor => {
      let noise = (Math.random() - 0.5) * (sensor.key === "ph" ? 0.5 : 10);
      return { ...sensor, value: Math.round((sensor.value + noise) * 10) / 10 };
    });
    setSensors(newSensors);
    analyzeSensors(newSensors);
  };

  // منطق اتخاذ القرار في ظل الارتباك
  const analyzeSensors = (sensorVals) => {
    let temp = sensorVals.find(s => s.key === "temperature").value;
    let hum = sensorVals.find(s => s.key === "humidity").value;
    let light = sensorVals.find(s => s.key === "light").value;
    let ph = sensorVals.find(s => s.key === "ph").value;

    // منطق بسيط: إذا كان هناك تضارب (مثلاً حرارة عالية ورطوبة منخفضة)
    if (temp > 30 && hum < 40) {
      setConflict(true);
      setDecision("⚠️ هناك تضارب: الحرارة مرتفعة والرطوبة منخفضة. يُنصح بتشغيل المروحة وزيادة الري.");
    } else if (light < 200) {
      setConflict(false);
      setDecision("الإضاءة منخفضة. يُنصح بتشغيل الإضاءة الاصطناعية.");
    } else if (ph < 6 || ph > 7.5) {
      setConflict(false);
      setDecision("⚠️ الرقم الهيدروجيني خارج النطاق المثالي. راقب محلول التربة.");
    } else {
      setConflict(false);
      setDecision("كل القيم ضمن النطاق المثالي. لا حاجة لأي إجراء.");
    }
  };

  return (
    <div style={{padding: 24, background: "#fffde7", borderRadius: 10, margin: "16px 0"}}>
      <div style={{fontWeight: "bold", fontSize: "1.1rem", marginBottom: 12}}>قراءة وتحليل قيم المستشعرات</div>
      <table style={{width: "100%", marginBottom: 16, direction: "rtl"}}>
        <thead>
          <tr>
            <th>المستشعر</th>
            <th>القيمة الحالية</th>
            <th>الوحدة</th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((s, i) => (
            <tr key={i}>
              <td>{s.name}</td>
              <td>{s.value}</td>
              <td>{s.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{textAlign: "center", margin: "16px 0"}}>
        <button
          onClick={readSensors}
          style={{
            background: "#fbc02d",
            color: "#333",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}
        >
          قراءة القيم من المستشعرات
        </button>
      </div>
      <div style={{
        marginTop: 16,
        color: conflict ? "#d32f2f" : "#388e3c",
        fontWeight: "bold",
        textAlign: "center"
      }}>
        {decision}
      </div>
      <div style={{marginTop: 12, color: "#555", fontSize: "0.97rem"}}>
        هذا القسم يحاكي اتخاذ القرار الذكي في ظل تعدد القياسات أو وجود تضارب بينها، ويمكنك تطوير المنطق ليعتمد على خوارزميات أكثر تعقيدًا أو حتى شبكات عصبية.
      </div>
    </div>
  );
}

export default SensorsSection;
