// components/AgriAssistantChat.js
import React, { useState } from "react";

function AgriAssistantChat() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "مرحبًا! أنا مساعدك الزراعي الذكي. اسألني عن أي شيء يخص مزرعتك." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setLoading(true);
    // استبدل هذا الجزء لاحقًا بربط فعلي مع الذكاء الاصطناعي
    const res = await fetch("http://127.0.0.1:5000/agri-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await res.json();
    setMessages(msgs => [...msgs, { from: "bot", text: data.answer }]);
    setInput("");
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 24, left: 24, width: 340, background: "#fff",
      borderRadius: 12, boxShadow: "0 2px 16px #0002", zIndex: 9999, padding: 12
    }}>
      <div style={{fontWeight: "bold", marginBottom: 8, textAlign: "center"}}>🤖 مساعدك الزراعي</div>
      <div style={{maxHeight: 180, overflowY: "auto", marginBottom: 8, direction: "rtl"}}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.from === "bot" ? "right" : "left",
            color: msg.from === "bot" ? "#1a237e" : "#388e3c",
            margin: "4px 0"
          }}>{msg.text}</div>
        ))}
      </div>
      <div style={{display: "flex", gap: 4}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          style={{flex: 1, borderRadius: 6, border: "1px solid #ccc", padding: "4px 8px"}}
          placeholder="اكتب سؤالك..."
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{borderRadius: 6, background: "#1a237e", color: "#fff", border: "none", padding: "4px 16px"}}>
          إرسال
        </button>
      </div>
    </div>
  );
}

export default AgriAssistantChat;
