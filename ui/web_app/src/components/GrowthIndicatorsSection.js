import React, { useState, useEffect } from "react";

const models = [
  { value: "simple_cnn", label: "شبكة CNN بسيطة" },
  { value: "mobilenet", label: "MobileNetV2" },
  { value: "resnet", label: "ResNet50" },
  { value: "vgg", label: "VGG16" }
];

// مكون فقاعة الإرشاد
const Tooltip = ({text}) => (
  <span style={{
    display: "inline-block",
    position: "relative",
    marginLeft: 6,
    cursor: "pointer"
  }}>
    <span style={{
      background: "#1976d2",
      color: "#fff",
      borderRadius: "50%",
      width: 22,
      height: 22,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "1.1rem"
    }}>؟</span>
    <span style={{
      visibility: "hidden",
      opacity: 0,
      transition: "opacity 0.2s",
      position: "absolute",
      bottom: "120%",
      right: "50%",
      transform: "translateX(50%)",
      background: "#fffde7",
      color: "#333",
      border: "1px solid #fbc02d",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: "0.98rem",
      minWidth: 180,
      zIndex: 10,
      textAlign: "right",
      boxShadow: "0 2px 8px #0002"
    }}
    className="tooltip-content"
    >{text}</span>
    <style>
      {`
      span[style*="cursor: pointer"]:hover .tooltip-content {
        visibility: visible !important;
        opacity: 1 !important;
      }
      `}
    </style>
  </span>
);

function GrowthIndicatorsSection() {
  const [folders, setFolders] = useState([]);
  const [csvs, setCSVs] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedCSVs, setSelectedCSVs] = useState([]);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);
  const [hyperParams, setHyperParams] = useState({});
  const [selectedModels, setSelectedModels] = useState(models.map(m => m.value));
  const [epochs, setEpochs] = useState(10);

  // تحميل قائمة المجلدات وملفات CSV تلقائياً
  useEffect(() => {
    fetch("http://127.0.0.1:5000/list-growth-folders-csvs")
      .then(res => res.json())
      .then(data => {
        setFolders(data.folders || []);
        setCSVs(data.csvs || []);
      });
  }, []);

  const handleParamChange = (model, param, value) => {
    setHyperParams(prev => ({
      ...prev,
      [model]: { ...prev[model], [param]: value }
    }));
  };

const handleTrain = async (e) => {
  e.preventDefault();
  if (selectedFolders.length === 0 || selectedCSVs.length === 0) {
    setStatus("يرجى اختيار مجلد صور واحد على الأقل وملف وسوم واحد على الأقل.");
    return;
  }
  setStatus("جاري تجهيز البيانات وتدريب النماذج...");
  setResults([]);

  // 1. اجلب كل الصور من المجلدات المختارة
  let images = [];
  for (let folder of selectedFolders) {
    const res = await fetch(`http://127.0.0.1:5000/list-images-in-folder?folder=${folder}`);
    const data = await res.json();
    images = images.concat(data.images || []);
  }

  // 2. حمل كل صورة كـ blob وأضفها للـ FormData
  const formData = new FormData();
  for (let imgName of images) {
    const res = await fetch(`http://127.0.0.1:5000/growth-indicators-image/${imgName}`);
    const blob = await res.blob();
    formData.append("images", new File([blob], imgName));
  }

  // 3. أضف ملف الوسوم (csv أو json)
  const labelsRes = await fetch(`http://127.0.0.1:5000/growth-indicators-labels?file=${selectedCSVs[0]}`);
  const labelsBlob = await labelsRes.blob();
  formData.append("labels_file", new File([labelsBlob], selectedCSVs[0]));

  // 4. أضف باقي البيانات
  formData.append("models", JSON.stringify(selectedModels));
  formData.append("epochs", epochs);
  formData.append("params", JSON.stringify(hyperParams));

  // 5. أرسل الطلب
  const trainRes = await fetch("http://127.0.0.1:5000/train-growth-indicators-models", {
    method: "POST",
    body: formData
  });
  const resultData = await trainRes.json();
  setResults(resultData.results || []);
  setStatus("تم تدريب ومقارنة النماذج بنجاح.");
};

  const bestModel = results.length
    ? results.reduce((a, b) => (a.accuracy || 0) > (b.accuracy || 0) ? a : b)
    : null;

  return (
    <div style={{
      padding: 32,
      background: "#e8f5e9",
      borderRadius: 14,
      margin: "24px 0",
      boxShadow: "0 2px 12px #0001",
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <h2 style={{
        textAlign: "center",
        color: "#388e3c",
        marginBottom: 18,
        fontWeight: "bold",
        letterSpacing: "1px"
      }}>
        تدريب نماذج مؤشرات النمو الظاهري بالصور
      </h2>
      <div style={{
        background: "#fffde7",
        border: "1px solid #fbc02d",
        borderRadius: 8,
        padding: 14,
        marginBottom: 24,
        fontSize: "1.07rem",
        color: "#795548",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <span style={{
          background: "#fbc02d",
          color: "#fff",
          borderRadius: "50%",
          width: 28,
          height: 28,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "1.3rem"
        }}>!</span>
        <div>
          <b>إرشادات:</b>
          <ul style={{margin: 0, padding: "0 18px"}}>
            <li>اختر مجلد أو أكثر من مجلدات الصور النظيفة (كل مجلد يمثل مجموعة صور).</li>
            <li>اختر ملف أو أكثر من ملفات الوسوم (CSV) المطابقة للصور.</li>
            <li>لا حاجة لرفع الصور يدويًا، فقط اختر من القائمة.</li>
            <li>يمكنك ضبط إعدادات النماذج وعدد التكرارات قبل بدء التدريب.</li>
          </ul>
        </div>
      </div>
      <div style={{
        display: "flex",
        gap: 32,
        marginBottom: 24,
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <div style={{
          background: "#f9f9f9",
          border: "2px solid #388e3c",
          borderRadius: 10,
          padding: 18,
          minWidth: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{fontWeight: "bold", marginBottom: 8, fontSize: "1.07rem"}}>
            مجلدات الصور
            <Tooltip text="اختر مجلد أو أكثر من مجلدات الصور التي تم تنظيفها مسبقًا. كل مجلد يحتوي على مجموعة صور مرتبطة بملف وسوم." />
          </div>
          {folders.length === 0 && <div style={{color: "#b71c1c"}}>لا توجد مجلدات صور متاحة</div>}
          <div style={{maxHeight: 120, overflowY: "auto", width: "100%"}}>
            {folders.map(f => (
              <label key={f} style={{display: "block", marginBottom: 4}}>
                <input
                  type="checkbox"
                  checked={selectedFolders.includes(f)}
                  onChange={e => {
                    setSelectedFolders(sel =>
                      e.target.checked ? [...sel, f] : sel.filter(x => x !== f)
                    );
                  }}
                /> {f}
              </label>
            ))}
          </div>
        </div>
        <div style={{
          background: "#f9f9f9",
          border: "2px solid #fbc02d",
          borderRadius: 10,
          padding: 18,
          minWidth: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{fontWeight: "bold", marginBottom: 8, fontSize: "1.07rem"}}>
            ملفات الوسوم (CSV)
            <Tooltip text="اختر ملف أو أكثر من ملفات الوسوم (CSV) التي تحتوي على أسماء الصور وقائمة الوسوم لكل صورة." />
          </div>
          {csvs.length === 0 && <div style={{color: "#b71c1c"}}>لا توجد ملفات وسوم متاحة</div>}
          <div style={{maxHeight: 120, overflowY: "auto", width: "100%"}}>
            {csvs.map(c => (
              <label key={c} style={{display: "block", marginBottom: 4}}>
                <input
                  type="checkbox"
                  checked={selectedCSVs.includes(c)}
                  onChange={e => {
                    setSelectedCSVs(sel =>
                      e.target.checked ? [...sel, c] : sel.filter(x => x !== c)
                    );
                  }}
                /> {c}
              </label>
            ))}
          </div>
        </div>
      </div>
      <form onSubmit={handleTrain} style={{direction: "rtl", textAlign: "right", marginTop: 12}}>
        <div style={{marginBottom: 16}}>
          <label style={{fontWeight: "bold"}}>النماذج المراد تدريبها:</label>
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
          <label style={{fontWeight: "bold"}}>عدد التكرارات (epochs):</label>
          <input type="number" value={epochs} min={5} max={100}
            onChange={e => setEpochs(Number(e.target.value))}
            style={{marginRight: 8, width: 60, borderRadius: 6, padding: "2px 8px"}}
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
            {["mobilenet", "resnet", "vgg"].includes(model) && (
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
            background: "#388e3c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            boxShadow: "0 2px 8px #0001"
          }}>درّب وقارن النماذج</button>
        </div>
      </form>
      {status && <div style={{marginTop: 16, color: "#388e3c", textAlign: "center", fontWeight: "bold"}}>{status}</div>}
      {results.length > 0 && (
        <div style={{marginTop: 16, background: "#f1f8e9", borderRadius: 8, padding: 12}}>
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
                <tr key={i} style={bestModel && r.model === bestModel.model ? {background: "#c8e6c9"} : {}}>
                  <td>{models.find(m => m.value === r.model)?.label || r.model}</td>
                  <td>{r.accuracy ? (r.accuracy * 100).toFixed(2) + "%" : (r.error ? "-" : "")}</td>
                  <td>{r.train_time ? r.train_time.toFixed(1) : "-"}</td>
                  <td style={{color: "red"}}>{r.error || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bestModel && (
            <div style={{marginTop: 12, color: "#388e3c", fontWeight: "bold"}}>
              ✅ النموذج الأفضل للاعتماد عند التنبؤ: {models.find(m => m.value === bestModel.model)?.label || bestModel.model} (دقة: {(bestModel.accuracy * 100).toFixed(2)}%)
            </div>
          )}
        </div>
      )}
      <div style={{marginTop: 18, color: "#555", fontSize: "0.97rem", textAlign: "center"}}>
        هذا القسم يسمح لك بتدريب عدة نماذج ذكاء اصطناعي لاستخراج مؤشرات النمو الظاهري من الصور، مع ضبط الإعدادات، ومقارنة الأداء، وترشيح النموذج الأفضل للاعتماد عليه لاحقًا في التنبؤ.
      </div>
    </div>
  );
}

export default GrowthIndicatorsSection;
