import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const ChatRoom = ({ roomId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Подключение к сокету
    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
    });

    // Присоединение к комнате
    socketRef.current.emit("join_room", roomId);

    // Получение сообщений
    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    const messageData = {
      room: roomId,
      content: message,
    };
  
    socketRef.current.emit("send_message", messageData);
    setMessage("");
  };
  

  return (
    <div>
      <h2>Чат комнаты: {roomId}</h2>
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
