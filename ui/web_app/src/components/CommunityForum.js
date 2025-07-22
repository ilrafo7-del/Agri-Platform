import React, { useState, useEffect } from "react";

function CommunityForum() {
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/community-posts")
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, []);

  const addPost = () => {
    if (!input.trim()) return;
    fetch("http://127.0.0.1:5000/community-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    })
      .then(res => res.json())
      .then(data => setPosts(data.posts));
    setInput("");
  };

  return (
    <div className="main-card">
      <div className="section-title" style={{textAlign: "center"}}>👥 مجتمع المزارعين</div>
      <div style={{marginBottom: 12}}>
        <input value={input} onChange={e => setInput(e.target.value)}
          style={{width: "80%", borderRadius: 6, border: "1px solid #ccc", padding: "4px 8px"}} />
        <button onClick={addPost} style={{marginRight: 8, borderRadius: 6, background: "#1a237e", color: "#fff", border: "none", padding: "4px 16px"}}>نشر</button>
      </div>
      <ul style={{direction: "rtl"}}>
        {posts.length === 0 && <li style={{color: "#888"}}>لا توجد مشاركات بعد.</li>}
        {posts.map((p, i) => <li key={i} style={{marginBottom: 8}}>{p.text}</li>)}
      </ul>
    </div>
  );
}

export default CommunityForum;
