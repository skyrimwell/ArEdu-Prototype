import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import chatstyles from "./styles/chatStyles";

const ChatRoom = ({ roomId, styles }) => {
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
    <div style={chatstyles.chatContainer}>
      <h3>Чат</h3>
      <div style={chatstyles.chatBox}>
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
        style={chatstyles.chatInput}
      />
      <button onClick={sendMessage} style={chatstyles.chatButton}>
        Отправить
      </button>
    </div>
  );
};

export default ChatRoom;
