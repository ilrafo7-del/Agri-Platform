import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function CompareLiveVsOptimal({ plant = "tomato" }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/compare-live-optimal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant })
      });
      const data = await res.json();
      if (data.status === "success") {
        setResult(data);
      } else {
        setError(data.message || "حدث خطأ في المقارنة");
      }
    } catch (err) {
      setError("فشل الاتصال بالخادم أو حدث خطأ داخلي.");
    }
    setLoading(false);
  };

  // تجهيز البيانات للرسم البياني
  let chartData = [];
  if (result) {
    chartData = result.indices.map((idx, i) => ({
      idx,
      الفعلي: result.actual_target[i],
      المتوقع: result.optimal_target[i]
    }));
  }

  return (
    <div>
      {/* زر المقارنة في المنتصف */}
      <div style={{textAlign: "center", margin: "24px 0"}}>
        <button
          onClick={handleCompare}
          disabled={loading}
          style={{
            background: "#1a237e",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontSize: "1.1rem",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          قارن القيم الحية والمتوقعة
        </button>
      </div>
      {loading && <div style={{textAlign: "center"}}>جاري المقارنة...</div>}
      {error && <div style={{color: "red", textAlign: "center"}}>{error}</div>}
      {result && (
        <div style={{ width: "100%", height: 400, direction: "ltr" }}>
          <h4 style={{textAlign: "center"}}>منحنى القيم الفعلية والمتوقعة</h4>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="idx" label={{ value: "الوقت", position: "insideBottomRight", offset: 0 }} />
              <YAxis label={{ value: "درجة الحرارة", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="الفعلي" stroke="#8884d8" name="الفعلي" />
              <Line type="monotone" dataKey="المتوقع" stroke="#82ca9d" name="المتوقع" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default CompareLiveVsOptimal;
