require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const cookie = require('cookie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const ROOMS_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const { spawn } = require('child_process');
const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.COOKIE_TOKEN;
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(ROOMS_UPLOAD_DIR));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

if (!fs.existsSync(ROOMS_UPLOAD_DIR)) {
  fs.mkdirSync(ROOMS_UPLOAD_DIR, { recursive: true });
}

// Регистрация
app.post('/register', async (req, res) => {
  const { email, password, ischecked } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const accountType = ischecked ? 1 : 0; // 1 - teacher, 0 - student

  try {
    await db.query('INSERT INTO users (email, password, accountType) VALUES (?, ?, ?)', [email, hashedPassword, accountType]);
    res.json({ success: true, message: 'Регистрация успешна' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка регистрации' });
  }
});

// Логин
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ success: false, message: 'Неверные данные' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Неверные данные' });
    }

    const token = jwt.sign({ id: user.id, accountType: user.accountType }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Вход успешен', token, user: { id: user.id, email: user.email, accountType: user.accountType } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка авторизации' });
  }
});

// Проверка авторизации 
app.get('/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Нет токена' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
});

// Профиль 
app.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Нет токена' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, message: 'Токен валидный', data: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
});

// комнаты по айди
app.get('/student-rooms/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const [rooms] = await db.query(
      'SELECT DISTINCT rooms.* FROM rooms JOIN room_students ON rooms.code = room_students.room_code WHERE room_students.student_id = ?',
      [studentId]
    );

    res.json({ success: true, rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка получения комнат' });
  }
});

app.get('/teacher-rooms', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Нет токена' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const accountType = decoded.accountType;

    if (accountType !== 1) {
      return res.status(403).json({ success: false, message: 'Нет прав доступа' });
    }

    const [rooms] = await db.query('SELECT * FROM rooms WHERE teacher_id = ?', [userId]);
    res.json({ success: true, rooms });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: 'Ошибка токена или сервера' });
  }
});

// Создание комнаты
app.post('/create-room', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Нет токена' });
  }

  const token = authHeader.split(' ')[1];
  const { roomName } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const accountType = decoded.accountType;

    if (accountType !== 1) {
      return res.status(403).json({ success: false, message: 'Нет прав доступа' });
    }

    // Генерация уникального кода комнаты
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await db.query('INSERT INTO rooms (name, code, teacher_id) VALUES (?, ?, ?)', [roomName, roomCode, userId]);

    res.json({ success: true, roomCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка сервера при создании комнаты' });
  }
});

app.get('/room-students/:roomCode', async (req, res) => {
  const { roomCode } = req.params;

  try {
    const [students] = await db.query(
      'SELECT users.id, users.email FROM room_students JOIN users ON room_students.student_id = users.id WHERE room_students.room_code = ?',
      [roomCode]
    );
    res.json({ success: true, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка получения студентов' });
  }
});

// комнаты по айди преподавателя
app.get('/teacher-rooms/:teacherId', async (req, res) => {
  const { teacherId } = req.params;

  try {
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE creator_id = ?',
      [teacherId]
    );

    res.json({ success: true, rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка получения комнат преподавателя' });
  }
});

// зайти в комнату 
app.post('/join-room', async (req, res) => {
  const { token, roomCode } = req.body;

  if (!token || !roomCode) {
    return res.status(400).json({ success: false, message: 'Требуется токен и код комнаты' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const [rooms] = await db.query('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }

    const [existing] = await db.query('SELECT * FROM room_students WHERE room_code = ? AND student_id = ?', [roomCode, userId]);
    if (existing.length > 0) {
      return res.json({ success: true, message: 'Уже в комнате' });
    }

    await db.query('INSERT INTO room_students (room_code, student_id) VALUES (?, ?)', [roomCode, userId]);

    res.json({ success: true, message: 'Успешно присоединился к комнате' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: 'Ошибка токена или сервера' });
  }
});

// студенты в комнате
app.post('/get-room-students', async (req, res) => {
  const { token, roomCode } = req.body;

  if (!token || !roomCode) {
    return res.status(400).json({ success: false, message: 'Требуется токен и код комнаты' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    const [rooms] = await db.query('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }

    const [students] = await db.query(
      'SELECT users.id, users.email, users.accountType FROM room_students JOIN users ON room_students.student_id = users.id WHERE room_students.room_code = ?',
      [roomCode]
    );

    res.json({ success: true, students });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: 'Ошибка токена или сервера' });
  }
});

app.post('/mark-attendance', async (req, res) => {
  const { studentId, roomCode } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    await db.query(
      'INSERT INTO attendance (student_id, room_code, date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status=TRUE',
      [studentId, roomCode, today]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка при отметке посещаемости:", error);
    res.status(500).json({ message: "Ошибка при отметке посещаемости" });
  }
});

app.post('/generate-attendance/:roomCode', async (req, res) => {
  const { roomCode } = req.params;
  const roomDir = path.join(ROOMS_UPLOAD_DIR, roomCode);

  try {
    const [rows] = await db.query(`
      SELECT users.email AS name, a.date, a.status 
      FROM attendance a 
      JOIN users ON users.id = a.student_id 
      WHERE a.room_code = 'D4FOY6'
      ORDER BY a.date DESC;
    `, [roomCode]);

    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true });
    }

    const reportPath = path.join(roomDir, `attendance_${roomCode}.txt`);
    let content = `Отчёт о посещаемости для комнаты ${roomCode}\n\n`;

    for (const row of rows) {
      content += `${row.date} | ${row.name} | ${row.status ? 'Присутствовал' : 'Отсутствовал'}\n`;
    }

    fs.writeFileSync(reportPath, content, 'utf8');

    res.json({ success: true, message: 'Отчёт сформирован', filename: `attendance_${roomCode}.txt` });
  } catch (err) {
    console.error('Ошибка при создании отчёта:', err);
    res.status(500).json({ success: false, message: 'Ошибка при создании отчёта' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const roomCode = req.params.roomCode;
    const roomDir = path.join(ROOMS_UPLOAD_DIR, roomCode);
    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true });
    }
    cb(null, roomDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.post('/upload/:roomCode', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Файл не загружен' });
  }

  const { originalname, path: filePath } = req.file;
  const roomDir = path.dirname(filePath);

  if (originalname.endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const txtPath = path.join(roomDir, originalname.replace(/\.docx$/, '.txt'));
      fs.writeFileSync(txtPath, result.value, 'utf8');
      console.log(`Файл ${originalname} конвертирован в TXT`);
      fs.copyFileSync(txtPath,)
    } catch (err) {
      console.error('Ошибка при конвертации .docx в .txt:', err);
    }
  }

  res.json({ success: true, message: 'Файл загружен' });
});

app.get('/files/:roomCode', (req, res) => {
  const roomDir = path.join(ROOMS_UPLOAD_DIR, req.params.roomCode);
  if (!fs.existsSync(roomDir)) {
    return res.json({ success: true, files: [] });
  }

  fs.readdir(roomDir, (err, files) => {
    if (err) {
      console.error('Ошибка чтения директории:', err);
      return res.status(500).json({ success: false, message: 'Ошибка чтения файлов' });
    }
    res.json({ success: true, files });
  });
});

app.get('/download/:roomCode/:filename', (req, res) => {
  const filePath = path.join(ROOMS_UPLOAD_DIR, req.params.roomCode, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Файл не найден' });
  }
  res.download(filePath);
});

app.get('/downloadRaw/:roomCode/:filename', (req, res) => {
  const filePath = path.join(ROOMS_UPLOAD_DIR, req.params.roomCode, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Файл не найден' });
  }

  const ext = path.extname(filePath);
  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
      return res.json({text: text}); 
  }

  res.download(filePath);
});


app.post('/launch-app-teacher', async (req, res) => {
  const { roomCode } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !roomCode) {
    return res.status(400).json({ success: false, message: 'Нужен токен и код комнаты' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);

    const exePath = path.join(__dirname, '..', '..',  'VR_Edu_Prototype','Windows', 'VREdu.exe');
    const args = [`ThirdPersonMap?listen`, `-jwt=${token}`, `-roomCode=${roomCode}`];

    const child = spawn(exePath, args, {
      detached: true,
      stdio: 'ignore'
    });
    console.log(`Запуск VR клиента с токеном ${token} и кодом комнаты ${roomCode}`);
    child.unref(); 

    return res.json({ success: true, message: 'Сервер запускается' });

  } catch (err) {
    console.error("Ошибка токена или запуска:", err);
    return res.status(401).json({ success: false, message: 'Невалидный токен или ошибка запуска' });
  }
});


app.post('/launch-app-student', async (req, res) => {
  const { roomCode } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !roomCode) {
    return res.status(400).json({ success: false, message: 'Нужен токен и код комнаты' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);

    const exePath = path.join(__dirname, '..', '..',  'VR_Edu_Prototype', 'Windows','VREdu.exe');
    const args = [`127.0.0.1`, `-jwt=${token}`, `-roomCode=${roomCode}`];

    const child = spawn(exePath, args, {
      detached: true,
      stdio: 'ignore' 
    });
    console.log(`Запуск VR клиента с токеном ${token} и кодом комнаты ${roomCode}`); 
    child.unref();

    return res.json({ success: true, message: 'Сервер запускается' });

  } catch (err) {
    console.error("Ошибка токена или запуска:", err);
    return res.status(401).json({ success: false, message: 'Невалидный токен или ошибка запуска' });
  }
});

app.post('/check-access', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { roomCode } = req.body;

  if (!authHeader || !roomCode) {
    return res.status(400).json({ access: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const studentId = decoded.id;

    const [rows] = await db.query(
      'SELECT * FROM room_students WHERE room_code = ? AND student_id = ?',
      [roomCode, studentId]
    );

    return res.json({ access: rows.length > 0 });
  } catch (err) {
    return res.status(401).json({ err });
  }
});


// HTTP сервер
const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  console.log(`HTTP сервер на порту ${PORT}`);
});

// --- WebSocket сервер с помощью socket.io ---
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    console.log("Нет токена при подключении через сокет.");
    socket.disconnect();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Ошибка JWT при подключении через сокет:", err.message);
      socket.disconnect();
      return;
    }

    console.log("Пользователь подключился через сокет:", decoded.email || decoded.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`Пользователь ${decoded.id} присоединился к комнате ${roomId}`);
    });

    socket.on("send_message", (data) => {
      console.log("Новое сообщение:", data);
      io.to(data.room).emit("receive_message", {
        sender: decoded.email || `Пользователь ${decoded.id}`,
        content: data.content,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Пользователь ${decoded.id} отключился`);
    });
  });
});