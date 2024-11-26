require('dotenv').config();

const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;


app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_NAME, 
});

// Проверка соединения с базой
db.connect((err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err);
  } else {
    console.log("Успешное подключение к базе данных.");
  }
});

// Роут для регистрации
app.post("/register", (req, res) => {
  const { email, password, ischecked } = req.body;

  const query = "INSERT INTO users (email, password, accountType) VALUES (?, ?, ?)";
  db.query(query, [email, password, ischecked ? 1 : 0], (err, result) => {
    if (err) {
      res.status(500).send("Ошибка при регистрации");
    } else {
      res.status(201).send("Регистрация успешна!");
    }
  });
});

// Роут для логина
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      res.status(500).send("Ошибка сервера");
    } else if (results.length > 0) {
      const user = results[0]
      res.status(200).json({
        message:"Вход выполнен",
        accountType: user.accountType,
      })
    } else {
      res.status(401).send("Неверные данные");
    }
  });
});

const generateRoomCode = () => Math.random().toString(36).substring(2, 8); // Генерация уникального кода комнаты

app.post("/create-room", (req, res) => {
  const { roomName } = req.body;
  const roomCode = generateRoomCode();

  const query = "INSERT INTO rooms (name, code) VALUES (?, ?)";
  db.query(query, [roomName, roomCode], (err, result) => {
    if (err) {
      console.error("Ошибка при создании комнаты:", err);
      res.status(500).send("Ошибка сервера");
    } else {
      res.status(201).json({ roomCode });
    }
  });
});

app.get("/teacher-rooms", (req, res) => {
  const query = "SELECT * FROM rooms";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Ошибка при получении комнат:", err);
      res.status(500).send("Ошибка сервера");
    } else {
      res.status(200).json({ rooms: results });
    }
  });
});

app.get("/room-students/:roomCode", (req, res) => {
  const { roomCode } = req.params;

  const query = `
    SELECT students.email 
    FROM students
    JOIN room_students ON students.id = room_students.student_id
    WHERE room_students.room_code = ?
  `;
  db.query(query, [roomCode], (err, results) => {
    if (err) {
      console.error("Ошибка при получении студентов:", err);
      res.status(500).send("Ошибка сервера");
    } else {
      res.status(200).json({ students: results });
    }
  });
});

app.post("/join-room", (req, res) => {
  const { roomCode, studentId } = req.body;

  // Проверяем, существует ли комната
  const checkRoomQuery = "SELECT * FROM rooms WHERE code = ?";
  db.query(checkRoomQuery, [roomCode], (err, results) => {
    if (err) {
      console.error("Ошибка при проверке комнаты:", err);
      res.status(500).send("Ошибка сервера");
    } else if (results.length === 0) {
      res.status(404).json({ message: "Комната с таким кодом не найдена" });
    } else {
      // Если комната найдена, связываем студента с комнатой
      const insertQuery =
        "INSERT INTO room_students (room_code, student_id) VALUES (?, ?)";
      db.query(insertQuery, [roomCode, studentId], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            res.status(400).json({ message: "Вы уже подключены к этой комнате" });
          } else {
            console.error("Ошибка при подключении студента:", err);
            res.status(500).send("Ошибка сервера");
          }
        } else {
          res.status(201).send("Вы успешно подключились к комнате");
        }
      });
    }
  });
});

app.get("/student-rooms/:studentId", (req, res) => {
  const { studentId } = req.params;

  const query = `
    SELECT rooms.name, rooms.code
    FROM rooms
    JOIN room_students ON rooms.code = room_students.room_code
    WHERE room_students.student_id = ?
  `;
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Ошибка при получении комнат:", err);
      res.status(500).send("Ошибка сервера");
    } else {
      res.status(200).json({ rooms: results });
    }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
