import React, { useState, useRef, useEffect } from "react";

function LiveDataCollection() {
  // --- المستشعرات ---
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorInterval, setSensorInterval] = useState(60);
  const [sensorData, setSensorData] = useState([]);
  const sensorTimer = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  // --- الكاميرا ---
  const [cameraActive, setCameraActive] = useState(false);
  const [autoCamera, setAutoCamera] = useState(false);
  const [cameraInterval, setCameraInterval] = useState(300);
  const [images, setImages] = useState([]);
  const cameraTimer = useRef(null);
  const videoRef = useRef();

  // --- تحميل الصور ---
  const handleDownloadImages = () => {
    images.forEach(img => {
      const link = document.createElement("a");
      link.href = img.url;
      link.download = `${img.plant}_${img.label}_${img.date}.jpg`;
      link.click();
    });
  };

  // --- حفظ ملف CSV ---
  const handleDownloadCSV = () => {
    const header = "date,temperature,humidity,ph_level,light_intensity\n";
    const rows = sensorData.map(row =>
      [row.date, row.temperature, row.humidity, row.ph_level, row.light_intensity].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], {type: "text/csv"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sensor_data.csv";
    link.click();
  };

  // --- تفعيل/تعطيل قراءة المستشعرات ---
  useEffect(() => {
    if (sensorActive) {
      sensorTimer.current = setInterval(() => {
        // هنا ضع كود جلب القيم الحقيقية من السيرفر أو من الراسبيري
          fetch(`${API_URL}/latest-sensor-data?plant=tomato`)
          .then(res => res.json())
          .then(data => setSensorData(prev => [
            ...prev,
            {...data, date: new Date().toLocaleString()}
          ]));
      }, sensorInterval * 1000);
    } else {
      clearInterval(sensorTimer.current);
    }
    return () => clearInterval(sensorTimer.current);
  }, [sensorActive, sensorInterval]);

  // --- تفعيل/تعطيل الكاميرا ---
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        videoRef.current.srcObject = stream;
      });
    } else if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  }, [cameraActive]);

  // --- الوضع التلقائي للكاميرا ---
  useEffect(() => {
    if (autoCamera && cameraActive) {
      cameraTimer.current = setInterval(() => {
        // التقاط صورة من الفيديو
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          setImages(prev => [
            ...prev,
            {
              url,
              plant: "tomato",
              label: "auto",
              date: new Date().toLocaleString()
            }
          ]);
          // يمكنك هنا إرسال الصورة للسيرفر إذا أردت
        }, "image/jpeg");
      }, cameraInterval * 1000);
    } else {
      clearInterval(cameraTimer.current);
    }
    return () => clearInterval(cameraTimer.current);
  }, [autoCamera, cameraActive, cameraInterval]);

  // --- التقاط صورة يدوي ---
  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      setImages(prev => [
        ...prev,
        {
          url,
          plant: "tomato",
          label: "manual",
          date: new Date().toLocaleString()
        }
      ]);
      // يمكنك هنا إرسال الصورة للسيرفر إذا أردت
    }, "image/jpeg");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f6f8fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0001",
        padding: 32,
        minWidth: 340,
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32
      }}>
        {/* التحكم في المستشعرات */}
        <div style={{textAlign: "center"}}>
          <h2>🌱 بيانات المستشعرات الحية</h2>
          <button
            onClick={() => setSensorActive(a => !a)}
            style={{
              background: sensorActive ? "#d32f2f" : "#388e3c",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 32px",
              fontSize: "1.1rem",
              margin: 8
            }}>
            {sensorActive ? "إيقاف القراءة" : "تشغيل القراءة"}
          </button>
          <label style={{marginRight: 12}}>
            المدة بين كل قراءة (ثانية):
            <input
              type="number"
              min={5}
              value={sensorInterval}
              onChange={e => setSensorInterval(Number(e.target.value))}
              style={{marginRight: 8, width: 60}}
              disabled={sensorActive}
            />
          </label>
          <button
            onClick={handleDownloadCSV}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: "1rem",
              margin: 8
            }}>
            تحميل ملف CSV
          </button>
          <div style={{marginTop: 12, maxHeight: 120, overflowY: "auto", background: "#f9f9f9", borderRadius: 8, padding: 8}}>
            <table style={{fontSize: "0.95rem", width: "100%"}}>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الحرارة</th>
                  <th>الرطوبة</th>
                  <th>PH</th>
                  <th>الإضاءة</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.slice(-5).reverse().map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td>{row.temperature}</td>
                    <td>{row.humidity}</td>
                    <td>{row.ph_level}</td>
                    <td>{row.light_intensity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* التحكم في الكاميرا */}
        <div style={{textAlign: "center"}}>
          <h2>📷 الكاميرا</h2>
          <button
            onClick={() => setCameraActive(a => !a)}
            style={{
              background: cameraActive ? "#d32f2f" : "#388e3c",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 32px",
              fontSize: "1.1rem",
              margin: 8
            }}>
            {cameraActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
          </button>
          <button
            onClick={handleCapture}
            disabled={!cameraActive}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: "1rem",
              margin: 8
            }}>
            التقاط صورة يدويًا
          </button>
          <label style={{marginRight: 12}}>
            <input
              type="checkbox"
              checked={autoCamera}
              onChange={e => setAutoCamera(e.target.checked)}
              disabled={!cameraActive}
            />
            تفعيل الوضع التلقائي
          </label>
          <label style={{marginRight: 12}}>
            المدة بين كل صورة (ثانية):
            <input
              type="number"
              min={10}
              value={cameraInterval}
              onChange={e => setCameraInterval(Number(e.target.value))}
              style={{marginRight: 8, width: 60}}
              disabled={!autoCamera || !cameraActive}
            />
          </label>
          <button
            onClick={handleDownloadImages}
            style={{
              background: "#7b1fa2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: "1rem",
              margin: 8
            }}>
            تحميل كل الصور
          </button>
          <div style={{marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center"}}>
            {images.slice(-3).reverse().map((img, i) => (
              <div key={i} style={{textAlign: "center"}}>
                <img src={img.url} alt="صورة" width={120} style={{borderRadius: 8, marginBottom: 4}} />
                <div style={{fontSize: "0.85rem"}}>{img.date}</div>
              </div>
            ))}
          </div>
          <video ref={videoRef} autoPlay width={320} height={240} style={{marginTop: 12, borderRadius: 8, display: cameraActive ? "block" : "none"}} />
        </div>
      </div>
    </div>
  );
}

export default LiveDataCollection;
