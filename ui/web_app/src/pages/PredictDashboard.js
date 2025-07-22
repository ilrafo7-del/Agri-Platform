import React, { useState, useRef } from "react";

function PredictDashboard() {
  const [plant, setPlant] = useState("tomato");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState(null);
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [image, setImage] = useState(null);
  const videoRef = useRef();

  // التقاط صورة من الكاميرا
  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    canvas.toBlob(blob => setImage(blob), "image/jpeg");
  };

  // إرسال البيانات للباكند
  const handlePredict = async (e) => {
    e.preventDefault();
    if (!image) {
      setStatus("يرجى التقاط صورة أولاً");
      return;
    }
    setStatus("جاري التحليل...");
    setDecision(null);
    const formData = new FormData();
    formData.append("plant", plant);
    formData.append("image", image, "live.jpg");
    formData.append("window_minutes", windowMinutes);
    const res = await fetch("http://127.0.0.1:5000/smart-decision", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setDecision(data);
    setStatus("");
  };

  // تفعيل الكاميرا
  const [cameraActive, setCameraActive] = useState(false);
  const handleCamera = () => {
    setCameraActive(true);
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
    });
  };

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa", padding: 32}}>
      <div className="main-card" style={{maxWidth: 600, margin: "32px auto"}}>
        <div className="section-title" style={{textAlign: "center"}}>🔮 التنبؤ الذكي واتخاذ القرار</div>
        <form onSubmit={handlePredict} style={{direction: "rtl", textAlign: "right"}}>
          <div style={{marginBottom: 16}}>
            <label>النبتة:</label>
            <select value={plant} onChange={e => setPlant(e.target.value)} style={{marginRight: 8}}>
              <option value="tomato">الطماطم</option>
              <option value="cucumber">الخيار</option>
              <option value="pepper">الفلفل</option>
            </select>
          </div>
          <div style={{marginBottom: 16}}>
            <label>مدة نافذة التحليل (دقائق):</label>
            <input type="number" min={5} max={60} value={windowMinutes}
              onChange={e => setWindowMinutes(Number(e.target.value))}
              style={{marginRight: 8, width: 60}} />
          </div>
          <div style={{marginBottom: 16}}>
            <button type="button" onClick={handleCamera}
              style={{background: "#1976d2", color: "#fff", borderRadius: 8, padding: "8px 24px", marginLeft: 8}}>
              تفعيل الكاميرا
            </button>
            <button type="button" onClick={handleCapture}
              disabled={!cameraActive}
              style={{background: "#388e3c", color: "#fff", borderRadius: 8, padding: "8px 24px"}}>
              التقاط صورة حية
            </button>
          </div>
          <video ref={videoRef} autoPlay width={320} height={240}
            style={{marginTop: 12, borderRadius: 8, display: cameraActive ? "block" : "none"}} />
          <div style={{textAlign: "center", marginTop: 16}}>
            <button type="submit" style={{
              background: "#1a237e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 32px",
              fontSize: "1.1rem"
            }}>تحليل واتخاذ قرار</button>
          </div>
        </form>
        {status && <div style={{marginTop: 16, color: "#1976d2", textAlign: "center"}}>{status}</div>}
        {decision && (
          <div style={{marginTop: 24, background: "#e3f2fd", borderRadius: 8, padding: 16}}>
            <b>القرار الذكي:</b>
            <ul>
              {decision.actions && decision.actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
            <div style={{marginTop: 8, color: "#555"}}>
              <b>ملاحظات:</b>
              <ul>
                {decision.notes && decision.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
              <b>تشخيص الصورة:</b> {decision.disease} (ثقة: {decision.disease_conf})
              <br />
              <b>اضطراب ظاهر:</b> {decision.disorder || "-"}
              <br />
              <b>إحصائيات المستشعرات (آخر {decision.window_minutes} دقيقة):</b>
              <pre style={{background: "#f9f9f9", borderRadius: 6, padding: 8, fontSize: "0.95rem"}}>
                {JSON.stringify(decision.sensor_stats, null, 2)}
              </pre>
              <b>القيم المثلى:</b>
              <pre style={{background: "#f9f9f9", borderRadius: 6, padding: 8, fontSize: "0.95rem"}}>
                {JSON.stringify(decision.optimal, null, 2)}
              </pre>
              <b>الفروقات:</b>
              <pre style={{background: "#f9f9f9", borderRadius: 6, padding: 8, fontSize: "0.95rem"}}>
                {JSON.stringify(decision.diffs, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictDashboard;