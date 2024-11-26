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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
