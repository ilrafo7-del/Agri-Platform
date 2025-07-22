import React, { useState } from "react";

// قائمة الوسوم الممكنة
const possibleLabels = [
  "green", "yellow", "wilting", "seedling", "flowering", "fruiting"
];

function AddSingleGrowthImage({onImageAdded}) {
  const [image, setImage] = useState(null);
  const [labels, setLabels] = useState([]);
  const [status, setStatus] = useState("");

  const handleImageChange = (e) => setImage(e.target.files[0]);
  const handleLabelChange = (e) => {
    const value = e.target.value;
    setLabels(labs =>
      labs.includes(value)
        ? labs.filter(l => l !== value)
        : [...labs, value]
    );
  };

  const handleUpload = async () => {
    if (!image || labels.length === 0) {
      setStatus("يرجى اختيار صورة ووسم واحد على الأقل");
      return;
    }
    const formData = new FormData();
    formData.append("image", image);
    formData.append("labels", labels.join(","));
    const res = await fetch("http://127.0.0.1:5000/add-growth-image", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setStatus(data.message);
    if (data.status === "success") {
      setImage(null);
      setLabels([]);
      if (onImageAdded) onImageAdded(image.name, labels);
    }
  };

  return (
    <div style={{
      background: "#f9f9f9",
      border: "2px solid #388e3c",
      borderRadius: 10,
      padding: 18,
      minWidth: 320,
      marginBottom: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <label style={{fontWeight: "bold", marginBottom: 8, fontSize: "1.07rem"}}>
        إضافة صورة جديدة مع وسوم
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
          fontSize: "1.1rem",
          marginLeft: 6,
          cursor: "pointer"
        }}
        title="اختر صورة واحدة ثم اختر وسومًا متعددة من القائمة وأضفها مباشرة إلى البيانات النظيفة.">
          ؟
        </span>
      </label>
      <input type="file" accept="image/*" onChange={handleImageChange} style={{margin: "8px 0"}} />
      <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8}}>
        {possibleLabels.map(l => (
          <label key={l} style={{
            background: labels.includes(l) ? "#388e3c" : "#e0e0e0",
            color: labels.includes(l) ? "#fff" : "#333",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              value={l}
              checked={labels.includes(l)}
              onChange={handleLabelChange}
              style={{marginLeft: 4}}
            />
            {l}
          </label>
        ))}
      </div>
      <button onClick={handleUpload} style={{
        width: 160,
        height: 44,
        fontSize: "1.05rem",
        borderRadius: 8,
        border: "none",
        margin: "8px 0",
        fontWeight: "bold",
        cursor: "pointer",
        background: "#388e3c",
        color: "#fff"
      }}>إضافة</button>
      <div style={{marginTop: 10, color: "#1976d2"}}>{status}</div>
    </div>
  );
}

function CleanGrowthIndicatorsData() {
  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState({});
  const [csvFile, setCsvFile] = useState(null);

  // رفع الصور
  const handleImagesChange = (e) => setImages(Array.from(e.target.files));

  // رفع ملف الوسوم
  const handleCsvChange = async (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    const newLabels = {};
    lines.forEach(line => {
      const [img, lbls] = line.split(",");
      newLabels[img.trim()] = lbls.replace(/"/g,"").split(",").map(l => l.trim()).filter(l => l);
    });
    setLabels(newLabels);
  };

  // تعديل وسم صورة معينة
  const handleLabelChange = (img, value) => {
    setLabels(labs => ({
      ...labs,
      [img]: value.split(",").map(l => l.trim()).filter(l => l)
    }));
  };

  // حذف صورة
  const handleRemoveImage = (imgName) => {
    setImages(imgs => imgs.filter(img => img.name !== imgName));
    setLabels(labs => {
      const newLabs = {...labs};
      delete newLabs[imgName];
      return newLabs;
    });
    // حذف من السيرفر (اختياري)
    fetch("http://127.0.0.1:5000/delete-growth-image", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({image: imgName})
    });
  };

  // إضافة وسم لصورة
  const handleAddLabel = (img, newLabel) => {
    setLabels(labs => ({
      ...labs,
      [img]: [...(labs[img] || []), newLabel.trim()].filter((v,i,a) => v && a.indexOf(v) === i)
    }));
  };

  // حذف وسم من صورة
  const handleRemoveLabel = (img, labelToRemove) => {
    setLabels(labs => ({
      ...labs,
      [img]: (labs[img] || []).filter(l => l !== labelToRemove)
    }));
    // حذف من السيرفر (اختياري)
    fetch("http://127.0.0.1:5000/delete-growth-label", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({image: img, label: labelToRemove})
    });
  };

  // حفظ البيانات النظيفة
  const handleSave = async () => {
    const formData = new FormData();
    images.forEach(img => formData.append("images", img));
    formData.append("labels", JSON.stringify(labels));
    await fetch("http://127.0.0.1:5000/clean-growth-indicators-data", {
      method: "POST",
      body: formData
    });
    alert("تم حفظ البيانات النظيفة!");
  };

  // --- جدول تفاعلي ---
  const renderTable = () => {
    const imgNames = [
      ...images.map(img => img.name),
      ...Object.keys(labels).filter(n => !images.find(img => img.name === n))
    ];
    return (
      <table style={{width: "100%", marginTop: 16, background: "#f9f9f9", borderRadius: 8, textAlign: "center"}}>
        <thead>
          <tr>
            <th>الصورة</th>
            <th>الوسوم (يمكن حذف أي وسم)</th>
            <th>تعديل الوسوم</th>
            <th>حذف صورة</th>
          </tr>
        </thead>
        <tbody>
          {imgNames.map(imgName => (
            <tr key={imgName}>
              <td>{imgName}</td>
              <td>
                {(labels[imgName] || []).map((lbl, idx) => (
                  <span key={idx} style={{
                    background: "#e8f5e9",
                    color: "#388e3c",
                    borderRadius: 6,
                    padding: "2px 8px",
                    margin: "0 4px",
                    display: "inline-block"
                  }}>
                    {lbl}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(imgName, lbl)}
                      style={{
                        marginLeft: 4,
                        background: "none",
                        border: "none",
                        color: "#b71c1c",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                      title="حذف هذا الوسم"
                    >×</button>
                  </span>
                ))}
              </td>
              <td>
                <input
                  type="text"
                  value={(labels[imgName] || []).join(",")}
                  onChange={e => handleLabelChange(imgName, e.target.value)}
                  placeholder="أدخل الوسوم مفصولة بفاصلة"
                  style={{width: 140, borderRadius: 6, padding: "2px 8px"}}
                />
                <br />
                <input
                  type="text"
                  placeholder="إضافة وسم جديد"
                  style={{width: 110, marginTop: 4, borderRadius: 6, padding: "2px 8px"}}
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      handleAddLabel(imgName, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(imgName)}
                  style={{
                    background: "#b71c1c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 24px",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // --- التوجيهات المختصرة ---
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

  const buttonStyle = {
    width: 160,
    height: 44,
    fontSize: "1.05rem",
    borderRadius: 8,
    border: "none",
    margin: "8px 0",
    fontWeight: "bold",
    cursor: "pointer"
  };

  return (
    <div style={{
      padding: 24,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h3 style={{textAlign: "center"}}>تنظيف بيانات مؤشرات النمو الظاهري (multi-label)</h3>
      {/* إطار إضافة صورة مع وسوم متعددة */}
      <AddSingleGrowthImage onImageAdded={(imgName, labelsArr) => {
        setImages(imgs => [...imgs, {name: imgName}]);
        setLabels(labs => ({
          ...labs,
          [imgName]: labelsArr
        }));
      }} />
      <div style={{
        display: "flex",
        gap: 32,
        alignItems: "flex-start",
        justifyContent: "center",
        flexWrap: "wrap",
        margin: "0 auto"
      }}>
        {/* إطار رفع الصور */}
        <div style={{
          background: "#f9f9f9",
          border: "2px solid #388e3c",
          borderRadius: 10,
          padding: 18,
          minWidth: 260,
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <label style={{fontWeight: "bold", marginBottom: 8, fontSize: "1.07rem"}}>
            رفع الصور
            <Tooltip text="ارفع صور مراحل النمو، ويجب أن يكون لكل صورة اسم فريد (مثال: img1.jpg)" />
          </label>
          <input type="file" multiple accept="image/*" onChange={handleImagesChange} style={{margin: "8px 0"}} />
        </div>
        {/* إطار رفع ملف الوسوم */}
        <div style={{
          background: "#f9f9f9",
          border: "2px solid #fbc02d",
          borderRadius: 10,
          padding: 18,
          minWidth: 260,
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <label style={{fontWeight: "bold", marginBottom: 8, fontSize: "1.07rem"}}>
            رفع ملف الوسوم (CSV)
            <Tooltip text='ارفع ملف وسوم بصيغة CSV يحتوي على عمودين: اسم الصورة وقائمة الوسوم (مثال: img1.jpg,"green,seedling")' />
          </label>
          <input type="file" accept=".csv" onChange={handleCsvChange} style={{margin: "8px 0"}} />
        </div>
        {/* إطار الحفظ */}
        <div style={{
          background: "#f9f9f9",
          border: "2px solid #1976d2",
          borderRadius: 10,
          padding: 18,
          minWidth: 180,
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <button onClick={handleSave} style={{
            ...buttonStyle,
            background: "#1976d2",
            color: "#fff"
          }}>حفظ البيانات النظيفة</button>
          <div style={{marginTop: 10}}>
            <Tooltip text="يمكنك تعديل الوسوم يدويًا في الجدول بالأسفل قبل الحفظ. كل صورة يمكن أن يكون لها وسم واحد أو عدة وسوم أو لا شيء." />
          </div>
        </div>
      </div>
      {Object.keys(labels).length > 0 && (
        <div style={{marginTop: 24, width: "100%", maxWidth: 900}}>
          {renderTable()}
        </div>
      )}
    </div>
  );
}

export default CleanGrowthIndicatorsData;
