import React, { useState } from "react";

function CleanDiseaseData() {
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("");

  const handleImagesChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleClean = async (e) => {
    e.preventDefault();
    setStatus("جاري رفع الصور وتنظيف البيانات...");
    const formData = new FormData();
    images.forEach(img => formData.append("images", img));
    const res = await fetch("http://127.0.0.1:5000/clean-disease-data", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setStatus(data.message || JSON.stringify(data));
  };

  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>
        🦠 تنظيف بيانات صور الأمراض
      </div>
      <form onSubmit={handleClean} style={{direction: "rtl", textAlign: "right"}}>
        <div style={{marginBottom: 16}}>
          <label>رفع صور النباتات (مصابة/سليمة):</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImagesChange}
            style={{marginRight: 8}}
          />
        </div>
        <div style={{textAlign: "center", marginTop: 24}}>
          <button type="submit" style={{
            background: "#7b1fa2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}>تنظيف بيانات الصور</button>
        </div>
      </form>
      {status && <div style={{marginTop: "20px", color: "#388e3c", textAlign: "center"}}>{status}</div>}
    </div>
  );
}

export default CleanDiseaseData;
