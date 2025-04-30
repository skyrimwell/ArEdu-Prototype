import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileSystemComponent from "./FileSystemComponent";
import withAuth from "./withAuth";
import styles from "./styles/TStyles";
import ChatRoom from "./chatRoom";

const TeacherDashboard = () => {
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleCreateRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomName }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoomCode(data.roomCode);
        fetchRooms();
        alert(`Комната "${roomName}" создана с кодом: ${data.roomCode}`);
      } else {
        alert("Ошибка при создании комнаты");
      }
    } catch (error) {
      console.error("Ошибка при создании комнаты:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/teacher-rooms", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Ошибка при получении комнат:", error);
    }
  };

  const fetchStudents = async (roomCode) => {
    try {
      const response = await fetch(`http://localhost:5000/room-students/${roomCode}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Ошибка при получении студентов:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
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
    <div style={styles.container('#3b6630')}>
      <div style={styles.leftPanel}>
        <h2>Личный кабинет преподавателя</h2>
  
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
  
        <div style={styles.section}>
          <h3>Мои комнаты</h3>
          {rooms.map((room) => (
            <div key={room.code} style={styles.room}>
              <p><strong>{room.name}</strong> (Код: {room.code})</p>
              <button onClick={() => fetchStudents(room.code)} style={styles.button}>
                Показать студентов
              </button>
            </div>
          ))}
        </div>
  
        {students.length > 0 && (
          <div style={styles.section}>
            <h3>Студенты в комнате</h3>
            <ul>
              {students.map((student) => (
                <ul key={student.id}>{student.email}</ul>
              ))}
            </ul>
          </div>
        )}
  
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <FileSystemComponent roomCode={room.code} isTeacher={true} />
          </div>
        ))}
      </div>
  
      <div style={styles.rightPanel}>
        <h3>Активные комнаты</h3>
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <p><strong>Комната № {room.code}</strong></p>
            <ChatRoom roomId={room.code} />
          </div>
        ))}
        <button style={{ ...styles.button, marginTop: '20px' }}> 
          Подключиться к VR комнате в роли ведущего
        </button>
        <button onClick={handleLogout} style={{ ...styles.button, marginTop: '20px' }}>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default withAuth(TeacherDashboard);
