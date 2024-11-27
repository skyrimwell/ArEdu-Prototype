import React, { useState, useEffect } from "react";
import withAuth from "./withAuth";
import { useNavigate } from "react-router-dom";
import ChatRoom from "./chatRoom";

const StudentDashboard = () => {
  const [roomCode, setRoomCode] = useState(""); // Код комнаты
  const [rooms, setRooms] = useState([]); // Подключенные комнаты
  const navigate = useNavigate();
  // Подключение к комнате
  const handleJoinRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, studentId: 1 }), // Используйте реальный ID студента
      });

      if (response.ok) {
        alert("Вы успешно подключились к комнате!");
        fetchRooms(); // Обновляем список комнат
      } else {
        const error = await response.json();
        alert(error.message || "Ошибка подключения к комнате");
      }
    } catch (error) {
      console.error("Ошибка при подключении к комнате:", error);
    }
  };

  // Получение подключенных комнат
  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/student-rooms/1"); // Используйте реальный ID студента
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);

      }
    } catch (error) {
      console.error("Ошибка при получении комнат:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include", // Передача куки
      });
  
      if (response.ok) {
        alert("Вы вышли из системы");
        navigate("/login");
      } else {
        alert("Ошибка при выходе");
      }
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  useEffect(() => {
    fetchRooms(); // Загружаем подключенные комнаты при загрузке компонента
  }, []);

  return (
    <div style={styles.container}>
      <h2>Личный кабинет студента</h2>

      {/* Подключение к комнате */}
      <div style={styles.section}>
        <h3>Подключиться к комнате</h3>
        <input
          type="text"
          placeholder="Введите код комнаты"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleJoinRoom} style={styles.button}>
          Подключиться
        </button>
      </div>

      {/* Список подключенных комнат */}
      <div style={styles.section}>
        <h3>Мои комнаты</h3>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.code} style={styles.room}>
              <p>
                <strong>{room.name}</strong> (Код: {room.code})
              </p>
            </div>
          ))
          
        ) : (
          <p>Вы еще не подключены ни к одной комнате.</p>
        )}
      </div>
      <div>
        <ChatRoom roomId={roomCode} />
      </div>
      <div>
        <button onClick={handleLogout}>Выйти</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
  },
  section: {
    marginBottom: "20px",
  },
  input: {
    padding: "10px",
    marginRight: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  room: {
    marginBottom: "10px",
  },
};

export default withAuth(StudentDashboard);
