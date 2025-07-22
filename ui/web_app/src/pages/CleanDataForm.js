import React, { useState } from "react";
import CleanEnvData from "../components/CleanEnvData";
import CleanDiseaseData from "../components/CleanDiseaseData";
import CleanSensorsData from "../components/CleanSensorsData";
import CleanFaultData from "../components/CleanFaultData";
import CleanGrowthIndicatorsData from "../components/CleanGrowthIndicatorsData";

function CleanDataForm() {
  const [openSection, setOpenSection] = useState({
    env: false,
    disease: false,
    sensors: false,
    fault: false
  });
  const toggleSection = (key) => setOpenSection(s => ({...s, [key]: !s[key]}));

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa", padding: 24}}>
      <div style={{display: "flex", flexDirection: "column", gap: 18, maxWidth: 900, margin: "32px auto"}}>
        <div onClick={() => toggleSection("env")} style={{
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
          <span>تنظيف بيانات الظروف البيئية</span>
        </div>
        {openSection.env && <CleanEnvData />}

        <div onClick={() => toggleSection("disease")} style={{
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
          <span>تنظيف بيانات صور الأمراض</span>
        </div>
        {openSection.disease && <CleanDiseaseData />}

        <div onClick={() => toggleSection("sensors")} style={{
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
          <span>تنظيف بيانات المستشعرات</span>
        </div>
        {openSection.sensors && <CleanSensorsData />}

        <div onClick={() => toggleSection("fault")} style={{
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
          <span>تنظيف بيانات أعطال الأجهزة</span>
        </div>
        {openSection.fault && <CleanFaultData />}

        <div onClick={() => toggleSection("growth")} style={{
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
          <span>تنظيف بيانات مؤشرات النمو الظاهري</span>
        </div>
        {openSection.growth && <CleanGrowthIndicatorsData />}
      </div>
    </div>
  );
}

export default CleanDataForm;
