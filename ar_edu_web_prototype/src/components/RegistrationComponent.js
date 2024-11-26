import React, { useState } from "react";
import { Link } from "react-router-dom";
const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ischecked, setIsChecked] = useState("")
  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      alert("Пароли не совпадают.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ischecked }),
      });
  
      if (response.ok) {
        alert("Регистрация успешна!");
      } else {
        alert("Ошибка при регистрации");
      }
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Регистрация</h2>
      <form onSubmit={handleRegister} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="confirmPassword">Повторите пароль:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div stle={styles.inputGroup}>
          <label htmlFor="teacher">Вы Преподаватель?</label>
          <input
            type="checkbox"
            id="teacher"
            checked={ischecked}
            onChange={(e) => setIsChecked(e.target.checked)}
          />
          
        </div>
        <button type="submit" style={styles.button}>
          Зарегистрироваться
        </button>
      </form>
      <p>
       Уже есть в системе? <Link to="/" style={styles.link}>Войдите</Link>
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f7f7f7",
  },
  title: {
    marginBottom: "20px",
  },
  form: {
    width: "300px",
    padding: "20px",
    borderRadius: "5px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  inputGroup: {
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  link: {
    color: "#007BFF",
    textDecoration: "none",
  },
};

export default RegisterPage;
