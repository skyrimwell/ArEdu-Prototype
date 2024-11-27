import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Подключение к серверу, который запущен на порту 5000
const socket = io("http://localhost:5000");

const ChatRoom = ({ roomId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Присоединяемся к комнате
    socket.emit("join_room", roomId);

    // Слушаем новые сообщения
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Очистка при размонтировании компонента
    return () => {
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    const messageData = {
      room: roomId,  // передаем идентификатор комнаты
      content: message,
      sender: "Пользователь", // Можете использовать имя пользователя
    };

    // Отправляем сообщение на сервер
    socket.emit("send_message", messageData);

    // Локально добавляем сообщение в состояние
    setMessages((prev) => [...prev, messageData]);

    // Очищаем поле ввода
    setMessage("");
  };

  return (
    <div>
      <h2>Комната: {roomId}</h2>
      <div style={{ border: "1px solid black", height: "300px", overflowY: "scroll" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}:</strong> {msg.content}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите сообщение"
      />
      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
};

export default ChatRoom;
