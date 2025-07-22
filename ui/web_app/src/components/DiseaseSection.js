import React, { useState } from "react";

const models = [
  { value: "simple_cnn", label: "شبكة CNN بسيطة" },
  { value: "mobilenet", label: "MobileNetV2" },
  { value: "resnet", label: "ResNet50" },
  { value: "vgg", label: "VGG16" }
];

function DiseaseSection() {
  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState([]);
  const [selectedModels, setSelectedModels] = useState(models.map(m => m.value));
  const [epochs, setEpochs] = useState(10);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);
  const [hyperParams, setHyperParams] = useState({});

  const handleImagesChange = (e) => setImages(Array.from(e.target.files));
  const handleLabelsChange = (e) => setLabels(e.target.value.split(",").map(l => l.trim()));

  const handleParamChange = (model, param, value) => {
    setHyperParams(prev => ({
      ...prev,
      [model]: { ...prev[model], [param]: value }
    }));
  };

  const handleTrain = async (e) => {
    e.preventDefault();
    setStatus("جاري رفع الصور وتدريب النماذج...");
    setResults([]);
    const formData = new FormData();
    images.forEach(img => formData.append("images", img));
    labels.forEach(label => formData.append("labels", label));
    formData.append("models", JSON.stringify(selectedModels));
    formData.append("epochs", epochs);
    formData.append("params", JSON.stringify(hyperParams));
    const res = await fetch("http://127.0.0.1:5000/train-disease-models", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setResults(data.results || []);
    setStatus("تم تدريب ومقارنة النماذج بنجاح.");
  };

  return (
    <div style={{padding: 24, background: "#f9f9f9", borderRadius: 10, margin: "16px 0"}}>
      <form onSubmit={handleTrain} style={{direction: "rtl", textAlign: "right"}}>
        <div style={{marginBottom: 16}}>
          <label>رفع صور النباتات (مصابة/سليمة):</label>
          <input type="file" multiple accept="image/*" onChange={handleImagesChange} style={{marginRight: 8}} />
        </div>
        <div style={{marginBottom: 16}}>
          <label>وسوم/تسميات الصور (مفصولة بفاصلة):</label>
            <input type="text" value={labels.join(",")} onChange={handleLabelsChange}
              placeholder="مثال: healthy,blight,spot"
              style={{marginRight: 8, borderRadius: 6, padding: "4px 12px", minWidth: 220}}
            />
        </div>
        <div style={{marginBottom: 16}}>
          <label>النماذج المراد تدريبها:</label>
          {models.map(m => (
            <label key={m.value} style={{marginLeft: 12}}>
              <input
                type="checkbox"
                checked={selectedModels.includes(m.value)}
                onChange={e => {
                  if (e.target.checked)
                    setSelectedModels([...selectedModels, m.value]);
                  else
                    setSelectedModels(selectedModels.filter(x => x !== m.value));
                }}
              /> {m.label}
            </label>
          ))}
        </div>
        <div style={{marginBottom: 16}}>
          <label>عدد التكرارات (epochs):</label>
          <input type="number" value={epochs} min={5} max={100}
            onChange={e => setEpochs(Number(e.target.value))}
            style={{marginRight: 8, width: 60}}
          />
        </div>
        {/* إعدادات خاصة بكل نموذج */}
        {selectedModels.map(model =>
          <div key={model} style={{marginBottom: 12, marginRight: 24, background: "#f9f9f9", padding: 8, borderRadius: 6}}>
            <b>{models.find(m => m.value === model)?.label} - معلمات:</b>
            {model === "simple_cnn" && (
              <>
                <label style={{marginRight: 8}}>عدد الطبقات:</label>
                <input type="number" value={hyperParams[model]?.layers || 2}
                  onChange={e => handleParamChange(model, "layers", Number(e.target.value))} style={{width: 40, marginRight: 8}} />
                <label style={{marginRight: 8}}>عدد الفلاتر:</label>
                <input type="number" value={hyperParams[model]?.filters || 32}
                  onChange={e => handleParamChange(model, "filters", Number(e.target.value))} style={{width: 40, marginRight: 8}} />
                <label style={{marginRight: 8}}>معدل التعلم:</label>
                <input type="number" step="0.0001" value={hyperParams[model]?.learning_rate || 0.001}
                  onChange={e => handleParamChange(model, "learning_rate", Number(e.target.value))} style={{width: 60, marginRight: 8}} />
              </>
            )}
            {model === "mobilenet" && (
              <>
                <label style={{marginRight: 8}}>معدل التعلم:</label>
                <input type="number" step="0.0001" value={hyperParams[model]?.learning_rate || 0.001}
                  onChange={e => handleParamChange(model, "learning_rate", Number(e.target.value))} style={{width: 60, marginRight: 8}} />
                <label style={{marginRight: 8}}>تجميد الطبقات الأساسية:</label>
                <input type="checkbox" checked={hyperParams[model]?.freeze_base ?? true}
                  onChange={e => handleParamChange(model, "freeze_base", e.target.checked)} style={{marginRight: 8}} />
              </>
            )}
            {model === "resnet" && (
              <>
                <label style={{marginRight: 8}}>معدل التعلم:</label>
                <input type="number" step="0.0001" value={hyperParams[model]?.learning_rate || 0.001}
                  onChange={e => handleParamChange(model, "learning_rate", Number(e.target.value))} style={{width: 60, marginRight: 8}} />
                <label style={{marginRight: 8}}>تجميد الطبقات الأساسية:</label>
                <input type="checkbox" checked={hyperParams[model]?.freeze_base ?? true}
                  onChange={e => handleParamChange(model, "freeze_base", e.target.checked)} style={{marginRight: 8}} />
              </>
            )}
            {model === "vgg" && (
              <>
                <label style={{marginRight: 8}}>معدل التعلم:</label>
                <input type="number" step="0.0001" value={hyperParams[model]?.learning_rate || 0.001}
                  onChange={e => handleParamChange(model, "learning_rate", Number(e.target.value))} style={{width: 60, marginRight: 8}} />
                <label style={{marginRight: 8}}>تجميد الطبقات الأساسية:</label>
                <input type="checkbox" checked={hyperParams[model]?.freeze_base ?? true}
                  onChange={e => handleParamChange(model, "freeze_base", e.target.checked)} style={{marginRight: 8}} />
              </>
            )}
          </div>
        )}
        <div style={{textAlign: "center", marginTop: 16}}>
          <button type="submit" style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}>درّب وقارن النماذج</button>
        </div>
      </form>
      {status && <div style={{marginTop: 16, color: "#388e3c", textAlign: "center"}}>{status}</div>}
      {results.length > 0 && (
        <div style={{marginTop: 16, background: "#e3f2fd", borderRadius: 8, padding: 12}}>
          <b>نتائج المقارنة:</b>
          <table style={{width: "100%", marginTop: 8}}>
            <thead>
              <tr>
                <th>النموذج</th>
                <th>الدقة</th>
                <th>الوقت (ث)</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{models.find(m => m.value === r.model)?.label || r.model}</td>
                  <td>{r.accuracy ? (r.accuracy * 100).toFixed(2) + "%" : (r.error ? "-" : "")}</td>
                  <td>{r.train_time ? r.train_time.toFixed(1) : "-"}</td>
                  <td style={{color: "red"}}>{r.error || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{marginTop: 12, color: "#555", fontSize: "0.97rem"}}>
        يمكنك مقارنة أداء عدة نماذج شبكات عميقة على نفس بيانات الصور لاختيار الأفضل.
      </div>
    </div>
  );
}

export default DiseaseSection;
