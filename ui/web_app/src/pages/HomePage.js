import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f6f8fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 32
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0001",
        padding: 40,
        minWidth: 340,
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32
      }}>
        <h1 style={{color: "#1976d2", marginBottom: 12}}>🌱 منصة الزراعة الدقيقة</h1>
        <p style={{fontSize: "1.15rem", color: "#444", textAlign: "center"}}>
          مرحبًا بك في منصة الزراعة الدقيقة المعتمدة على الذكاء الاصطناعي.<br />
          :اختر القسم الذي ترغب في استكشافه
        </p>
        <div style={{display: "flex", flexDirection: "column", gap: 18, width: "100%"}}>
          <Link to="/collect-live-data" style={linkStyle}>🌡️ جمع البيانات الحية</Link>
          <Link to="/clean-data" style={linkStyle}>🧹 تنظيف البيانات</Link>
          <Link to="/train-model" style={linkStyle}>🧠 تدريب النماذج</Link>
          <Link to="/predict" style={linkStyle}>🤖 التنبؤ</Link>
          <Link to="/control" style={linkStyle}>⚙️ التحكم</Link>
          <Link to="/community" style={linkStyle}>💬 المجتمع</Link>
        </div>
      </div>
    </div>
  );
}

const linkStyle = {
  background: "#e3f2fd",
  color: "#1976d2",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "1.1rem",
  padding: "14px 0",
  borderRadius: 8,
  textAlign: "center",
  boxShadow: "0 1px 4px #0001"
};

export default HomePage;
