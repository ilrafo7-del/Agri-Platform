import React, { useState, useEffect } from "react";

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/community-posts")
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, []);

  const handleAddPost = () => {
    if (!newPost.trim()) return;
    fetch("http://127.0.0.1:5000/community-posts", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text: newPost})
    })
      .then(res => res.json())
      .then(() => {
        setPosts(p => [{text: newPost}, ...p]);
        setNewPost("");
      });
  };

  return (
    <div style={{minHeight: "100vh", background: "#f6f8fa", padding: 24}}>
      <div style={{
        maxWidth: 700,
        margin: "32px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <h2 style={{color: "#1976d2", marginBottom: 18, textAlign: "center"}}>💬 منتدى المجتمع الزراعي</h2>
        <div style={{marginBottom: 24, display: "flex", gap: 12}}>
          <input
            type="text"
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="اكتب مشاركة جديدة..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #bbb",
              fontSize: "1.08rem"
            }}
            onKeyDown={e => { if (e.key === "Enter") handleAddPost(); }}
          />
          <button
            onClick={handleAddPost}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: "bold",
              fontSize: "1.08rem"
            }}
          >
            نشر
          </button>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          {posts.length === 0 && (
            <div style={{color: "#888", textAlign: "center"}}>لا توجد مشاركات بعد.</div>
          )}
          {posts.map((post, idx) => (
            <div key={idx} style={{
              background: "#e3f2fd",
              borderRadius: 10,
              padding: "14px 18px",
              fontSize: "1.08rem",
              color: "#1976d2",
              boxShadow: "0 1px 4px #0001"
            }}>
              {post.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommunityPage;
