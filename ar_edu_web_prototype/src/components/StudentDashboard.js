import React, { useState, useEffect } from "react";
import withAuth from "./withAuth";
import FileSystemComponent from "./FileSystemComponent";
import { useNavigate } from "react-router-dom";
import styles from "./styles/SStyles";
import ChatRoom from "./chatRoom";
import { jwtDecode } from "jwt-decode"; 


const StudentDashboard = () => {
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handleJoinRoom = async () => {
    try {
      const response = await fetch("http://localhost:5000/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token, roomCode }),
      });

      if (response.ok) {
        alert("Вы успешно подключились к комнате!");
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.message || "Ошибка подключения к комнате");
      }
    } catch (error) {
      console.error("Ошибка при подключении к комнате:", error);
    }
  };


  const fetchRooms = async () => {
    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id
      const response = await fetch(`http://localhost:5000/student-rooms/${userId}`, {
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

  const launchAppStudent = async () => {
    try {
      const response = await fetch("http://localhost:5000/launch-app-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomCode }),
      });
  
      if (response.ok) {
        alert("Вы успешно подключились к комнате!");
      } else {
        alert("Ошибка при подключении к комнате");
      }
    } catch (error) {
      console.error("Ошибка при подключении к комнате:", error);
    }
  };


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

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div style={styles.container('#2d2d7a')}>
      <div style={styles.leftPanel}>
        <h2>Личный кабинет студента</h2>
  
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
  
        <div style={styles.section}>
          <h3>Мои комнаты</h3>
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div key={room.code} style={styles.room}>
                <p><strong>{room.name}</strong> (Код: {room.code})</p>
              </div>
            ))
          ) : (
            <p>Вы еще не подключены ни к одной комнате.</p>
          )}
        </div>
  
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <FileSystemComponent roomCode={room.code} isTeacher={false} />
          </div>
        ))}
      </div>
  
      <div style={styles.rightPanel}>
        <h3>Активные комнаты</h3>
        {rooms.map((room) => (
          <div key={room.code} style={styles.room}>
            <p><strong>Комната {room.name}</strong></p>
            <ChatRoom roomId={room.code} />
          </div>
        ))}
        {rooms.map((room)=> (
          <button onClick={() => launchAppStudent(room.code)} style={{ ...styles.button, marginTop: '20px' }}> Подключиться к VR комнате в роли слушателя</button>
        ))}
        <button onClick={handleLogout} style={{ ...styles.button, marginTop: '20px' }}>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default withAuth(StudentDashboard);
