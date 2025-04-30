import React, { useState, useEffect } from 'react';

const FileSystemComponent = ({ roomCode, isTeacher }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/files/${roomCode}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Ошибка при загрузке списка файлов:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [roomCode]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    try {
      const response = await fetch(`http://localhost:5000/upload/${roomCode}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert("Файл загружен");
        fetchFiles();
        setSelectedFile(null);
      } else {
        alert("Ошибка загрузки файла");
      }
    } catch (err) {
      console.error("Ошибка при загрузке файла:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <h3>Файлы комнаты ({roomCode})</h3>

      {isTeacher && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            disabled={uploading}
          />
          <button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      )}

      <ul>
        {files.length > 0 ? (
          files.map((file, idx) => (
            <li key={idx}>
              <a
                href={`http://localhost:5000/download/${roomCode}/${encodeURIComponent(file)}`}
                target="_blank"
                rel="noopener noreferrer">
                {file}
              </a>
            </li>
          ))
        ) : (
          <li>Файлов пока нет</li>
        )}
      </ul>
    </div>
  );
};

export default FileSystemComponent;
