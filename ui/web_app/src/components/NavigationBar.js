// src/components/NavigationBar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/", label: "🏠 الرئيسية" },
  { to: "/collect-live-data", label: "🌡️ جمع البيانات الحية" },
  { to: "/clean-data", label: "🧹 تنظيف البيانات" },
  { to: "/train-model", label: "🧠 تدريب النماذج" },
  { to: "/predict", label: "🤖 التنبؤ" },
  { to: "/control", label: "⚙️ التحكم" },
  { to: "/community", label: "💬 المجتمع" }
];

function NavigationBar() {
  const location = useLocation();
  return (
    <nav style={{
      background: "#1976d2",
      padding: 0,
      boxShadow: "0 2px 8px #0001",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{
        display: "flex",
        gap: 0,
        flexWrap: "wrap",
        flexDirection: "row-reverse" // هذا هو التعديل المهم
      }}>
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              color: location.pathname === link.to ? "#fff" : "#e3f2fd",
              background: location.pathname === link.to ? "#1565c0" : "transparent",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.08rem",
              padding: "16px 22px",
              border: "none",
              borderBottom: location.pathname === link.to ? "3px solid #fff" : "3px solid transparent",
              transition: "background 0.2s, color 0.2s"
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default NavigationBar;
