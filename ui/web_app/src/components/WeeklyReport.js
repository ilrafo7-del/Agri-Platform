// components/WeeklyReport.js
import React, { useEffect, useState } from "react";
function WeeklyReport({ selectedPlant }) {
  const [report, setReport] = useState("");
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/weekly-report?plant=${selectedPlant}`)
      .then(res => res.json())
      .then(data => setReport(data.report));
  }, [selectedPlant]);
  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>📄 تقرير أسبوعي ذكي</div>
      <div style={{direction: "rtl", color: "#333"}}>{report}</div>
    </div>
  );
}
export default WeeklyReport;
