import React, { useState } from "react";
import EnvSection from "../components/EnvSection";
import DiseaseSection from "../components/DiseaseSection";
import SensorsSection from "../components/SensorsSection";
import FaultSection from "../components/FaultSection";
import GrowthIndicatorsSection from "../components/GrowthIndicatorsSection";

function TrainModelForm() {
  const toggleSection = (key) => setOpenSection(s => ({...s, [key]: !s[key]}));

  const [openSection, setOpenSection] = useState({
    env: false,
    disease: false,
    sensors: false,
    fault: false,
    growth: false // أضف هذا
  });

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa", padding: 24}}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxWidth: 900,
        margin: "32px auto"
      }}>
        <div onClick={() => toggleSection("env")}
          style={{
            cursor: "pointer",
            background: openSection.env ? "#e3f2fd" : "#fff",
            border: "2px solid #1976d2",
            borderRadius: 10,
            padding: "18px 24px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <span style={{fontSize: "2rem"}}>🌱</span>
          <span>توقع الظروف البيئية المثلى للنباتات</span>
          <span style={{
            marginRight: "auto",
            fontSize: "1.5rem",
            color: "#1976d2"
          }}>{openSection.env ? "▲" : "▼"}</span>
        </div>
        {openSection.env && <EnvSection />}

        <div onClick={() => toggleSection("disease")}
          style={{
            cursor: "pointer",
            background: openSection.disease ? "#f3e5f5" : "#fff",
            border: "2px solid #7b1fa2",
            borderRadius: 10,
            padding: "18px 24px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <span style={{fontSize: "2rem"}}>🦠</span>
          <span>كشف أمراض واضطرابات النبات بالصور</span>
          <span style={{
            marginRight: "auto",
            fontSize: "1.5rem",
            color: "#7b1fa2"
          }}>{openSection.disease ? "▲" : "▼"}</span>
        </div>
        {openSection.disease && <DiseaseSection />}

        <div onClick={() => toggleSection("sensors")}
          style={{
            cursor: "pointer",
            background: openSection.sensors ? "#fffde7" : "#fff",
            border: "2px solid #fbc02d",
            borderRadius: 10,
            padding: "18px 24px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <span style={{fontSize: "2rem"}}>🛰️</span>
          <span>التحكم في المستشعرات وقراءة القيم</span>
          <span style={{
            marginRight: "auto",
            fontSize: "1.5rem",
            color: "#fbc02d"
          }}>{openSection.sensors ? "▲" : "▼"}</span>
        </div>
        {openSection.sensors && <SensorsSection />}

        <div onClick={() => toggleSection("fault")}
          style={{
            cursor: "pointer",
            background: openSection.fault ? "#fff3e0" : "#fff",
            border: "2px solid #b71c1c",
            borderRadius: 10,
            padding: "18px 24px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <span style={{fontSize: "2rem"}}>🛠️</span>
          <span>كشف الأعطال وتوقعها للأجهزة</span>
          <span style={{
            marginRight: "auto",
            fontSize: "1.5rem",
            color: "#b71c1c"
          }}>{openSection.fault ? "▲" : "▼"}</span>
        </div>
        {openSection.fault && <FaultSection />}

        <div onClick={() => toggleSection("growth")}
          style={{
            cursor: "pointer",
            background: openSection.growth ? "#e8f5e9" : "#fff",
            border: "2px solid #388e3c",
            borderRadius: 10,
            padding: "18px 24px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <span style={{fontSize: "2rem"}}>🌿</span>
          <span>كشف مؤشرات النمو الظاهري بالصور</span>
          <span style={{
            marginRight: "auto",
            fontSize: "1.5rem",
            color: "#388e3c"
          }}>{openSection.growth ? "▲" : "▼"}</span>
        </div>
        {openSection.growth && <GrowthIndicatorsSection />}

      </div>
    </div>
  );
}

export default TrainModelForm;
