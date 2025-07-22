import React, { useEffect, useState } from "react";

function FileSelector({ folder, onSelect, label }) {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/list-files?folder=${folder}`)
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  }, [folder]);

  return (
    <div>
      <label>{label}</label>
      <select
        value={selected}
        onChange={e => {
          setSelected(e.target.value);
          onSelect(e.target.value);
        }}
      >
        <option value="">اختر من القائمة...</option>
        {files.map(file => (
          <option key={file.path} value={file.path}>
            {file.name} ({file.path})
          </option>
        ))}
      </select>
    </div>
  );
}

export default FileSelector;
