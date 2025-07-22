import React, { useState } from "react";

function CleanFaultData() {
  const [faultFile, setFaultFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFaultFile(e.target.files[0]);
  };

  const handleClean = async (e) => {
    e.preventDefault();
    setStatus("جاري رفع وتنظيف بيانات الأعطال...");
    const formData = new FormData();
    formData.append("fault_data", faultFile);
    const res = await fetch("http://127.0.0.1:5000/clean-fault-data", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setStatus(data.message || JSON.stringify(data));
  };

  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>
        🛠️ تنظيف بيانات أعطال الأجهزة
      </div>
      <form onSubmit={handleClean} style={{direction: "rtl", textAlign: "right"}}>
        <div style={{marginBottom: 16}}>
          <label>رفع ملف بيانات الأعطال (CSV):</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{marginRight: 8}}
          />
        </div>
        <div style={{textAlign: "center", marginTop: 24}}>
          <button type="submit" style={{
            background: "#b71c1c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}>تنظيف بيانات الأعطال</button>
        </div>
      </form>
      {status && <div style={{marginTop: "20px", color: "#388e3c", textAlign: "center"}}>{status}</div>}
    </div>
  );
}

export default CleanFaultData;
