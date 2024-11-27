import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "./withAuth";
import ChatRoom from "./chatRoom";

const TeacherDashboard = () => {
  const [roomName, setRoomName] = useState(""); // Название комнаты
  const [roomCode, setRoomCode] = useState(""); // Сгенерированный код комнаты
  const [rooms, setRooms] = useState([]); // Список комнат преподавателя
  const [students, setStudents] = useState([]); // Список студентов в комнате
  const navigate = useNavigate();
  // Создание комнаты
  const handleCreateRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoomCode(data.roomCode); // Устанавливаем сгенерированный код комнаты
        fetchRooms(); // Обновляем список комнат
        alert(`Комната "${roomName}" создана с кодом: ${data.roomCode}`);
      } else {
        alert("Ошибка при создании комнаты");
      }
    } catch (error) {
      console.error("Ошибка при создании комнаты:", error);
    }
  };

  // Получение списка комнат
  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/teacher-rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Ошибка при получении комнат:", error);
    }
  };

  // Получение списка студентов для конкретной комнаты
  const fetchStudents = async (roomCode) => {
    try {
      const response = await fetch(
        `http://localhost:5000/room-students/${roomCode}`
      );
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Ошибка при получении студентов:", error);
    }
  };


  useEffect(() => {
    fetchRooms(); // Загружаем список комнат при загрузке компонента
  }, []);

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

  
  return (
    <div style={styles.container}>
      <h2>Личный кабинет преподавателя</h2>

      {/* Создание комнаты */}
      <div style={styles.section}>
        <h3>Создать комнату</h3>
        <input
          type="text"
          placeholder="Название комнаты"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleCreateRoom} style={styles.button}>
          Создать
        </button>
        {roomCode && (
          <p>Код для подключения: <strong>{roomCode}</strong></p>
        )}
      </div>

      {/* Список комнат */}
      <div style={styles.section}>
        <h3>Мои комнаты</h3>
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <p>
              <strong>{room.name}</strong> (Код: {room.code})
            </p>
            <button
              onClick={() => fetchStudents(room.code)}
              style={styles.button}
            >
              Показать студентов
            </button>
          </div>
        ))}
      </div>

      {/* Список студентов */}
      {students.length > 0 && (
        <div style={styles.section}>
          <h3>Студенты в комнате</h3>
          <ul>
            {students.map((student) => (
              <li key={student.id}>{student.email}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <ChatRoom roomId={room.code} />
          </div>
        ))}
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
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  room: {
    marginBottom: "10px",
  },
};

export default withAuth(TeacherDashboard);
