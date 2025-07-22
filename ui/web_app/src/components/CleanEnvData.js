import React, { useState, useEffect } from "react";

const plants = [
  { value: "tomato", label: "الطماطم 🍅" },
  { value: "cucumber", label: "الخيار 🥒" },
  { value: "pepper", label: "الفلفل 🌶️" }
];

function CleanData() {
  const [selectedPlant, setSelectedPlant] = useState("tomato");
  const [rawFiles, setRawFiles] = useState([]);
  const [selectedRawFile, setSelectedRawFile] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setRawFiles([
      `data/raw/${selectedPlant}_live.csv`
    ]);
    setSelectedRawFile(`data/raw/${selectedPlant}_live.csv`);
  }, [selectedPlant]);

  const handleClean = (e) => {
    e.preventDefault();
    if (!selectedRawFile) {
      setStatus("يرجى اختيار ملف البيانات الخام.");
      return;
    }
    fetch("http://127.0.0.1:5000/preprocess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw_path: selectedRawFile,
        plant: selectedPlant
      })
    })
      .then(res => res.json())
      .then(data => setStatus(data.message || JSON.stringify(data)))
      .catch(() => setStatus("حدث خطأ أثناء تنظيف البيانات!"));
  };

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa"}}>
      <div className="main-card">
        <div className="section-title" style={{textAlign: "center", justifyContent: "center"}}>
          <span>🧹</span> تنظيف البيانات
        </div>
        <form onSubmit={handleClean} style={{direction: "rtl", textAlign: "right"}}>
          <div style={{marginBottom: 16}}>
            <label>اختر النبتة:</label>
            <select
              value={selectedPlant}
              onChange={e => setSelectedPlant(e.target.value)}
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px"}}
            >
              {plants.map(plant => (
                <option key={plant.value} value={plant.value}>{plant.label}</option>
              ))}
            </select>
          </div>
          <div style={{marginBottom: 16}}>
            <label>ملف البيانات الخام:</label>
            <select value={selectedRawFile} onChange={e => setSelectedRawFile(e.target.value)}
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px"}}>
              {rawFiles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div style={{textAlign: "center", marginTop: 24}}>
            <button type="submit" style={{
              background: "#1a237e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 32px",
              fontSize: "1.1rem"
            }}>نظف البيانات</button>
          </div>
        </form>
        {status && <div style={{marginTop: "20px", color: "#388e3c", textAlign: "center"}}>{status}</div>}
      </div>
    </div>
  );
}

export default CleanData;
