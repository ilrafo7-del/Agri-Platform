import React, { useState } from "react";

function FaultSection() {
  const [usageData, setUsageData] = useState([]);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  // رفع ملف بيانات التشغيل (CSV)
  const handleFileChange = (e) => {
    setUsageData(e.target.files[0]);
  };

  // تدريب نموذج كشف الأعطال (مثال: Isolation Forest)
  const handleTrain = async (e) => {
    e.preventDefault();
    setStatus("جاري رفع البيانات وتدريب النموذج...");
    setResult(null);
    const formData = new FormData();
    formData.append("usage_data", usageData);
    const res = await fetch("http://127.0.0.1:5000/train-fault-detector", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setResult(data);
    setStatus("تم تدريب نموذج كشف الأعطال بنجاح.");
  };

  // اختبار نموذج كشف الأعطال على بيانات جديدة
  const [testFile, setTestFile] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const handleTestChange = (e) => {
    setTestFile(e.target.files[0]);
  };

  const handleTest = async (e) => {
    e.preventDefault();
    setStatus("جاري اختبار النموذج...");
    setTestResult(null);
    const formData = new FormData();
    formData.append("test_data", testFile);
    const res = await fetch("http://127.0.0.1:5000/test-fault-detector", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setTestResult(data);
    setStatus("تم اختبار النموذج.");
  };

  return (
    <div style={{padding: 24, background: "#fff3e0", borderRadius: 10, margin: "16px 0"}}>
      <form onSubmit={handleTrain} style={{direction: "rtl", textAlign: "right"}}>
        <div style={{marginBottom: 16}}>
          <label>رفع ملف بيانات تشغيل الأجهزة (CSV):</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{marginRight: 8}}
          />
        </div>
        <div style={{textAlign: "center", marginTop: 16}}>
          <button type="submit" style={{
            background: "#b71c1c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}>درّب نموذج كشف الأعطال</button>
        </div>
      </form>
      {status && <div style={{marginTop: 16, color: "#388e3c", textAlign: "center"}}>{status}</div>}
      {result && (
        <div style={{marginTop: 16, background: "#fffde7", borderRadius: 8, padding: 12}}>
          <b>نتيجة التدريب:</b>
          <pre style={{direction: "ltr", fontFamily: "monospace"}}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleTest} style={{direction: "rtl", textAlign: "right", marginTop: 32}}>
        <div style={{marginBottom: 16}}>
          <label>اختبار النموذج على بيانات جديدة (CSV):</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleTestChange}
            style={{marginRight: 8}}
          />
        </div>
        <div style={{textAlign: "center", marginTop: 16}}>
          <button type="submit" style={{
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem"
          }}>اختبر النموذج</button>
        </div>
      </form>
      {testResult && (
        <div style={{marginTop: 16, background: "#ffe0b2", borderRadius: 8, padding: 12}}>
          <b>نتيجة الاختبار:</b>
          <pre style={{direction: "ltr", fontFamily: "monospace"}}>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}
      <div style={{marginTop: 12, color: "#555", fontSize: "0.97rem"}}>
        هذا القسم يستخدم خوارزميات كشف الشذوذ (مثل Isolation Forest) أو الشبكات العصبية لتحليل بيانات التشغيل والتعرف على الأعطال المتوقعة للأجهزة.
      </div>
    </div>
  );
}

export default FaultSection;
