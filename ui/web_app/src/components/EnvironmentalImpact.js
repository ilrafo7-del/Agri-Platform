// components/EnvironmentalImpact.js
import React, { useEffect, useState } from "react";
function EnvironmentalImpact({ selectedPlant }) {
  const [impact, setImpact] = useState("");
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/environmental-impact?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => setImpact(data.impact));
  }, [selectedPlant]);
  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>🌱 الأثر البيئي</div>
      <div style={{direction: "rtl", color: "#333"}}>{impact}</div>
    </div>
  );
}
export default EnvironmentalImpact;
