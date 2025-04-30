import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./styles/loginStyles";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        if (data.user.accountType === 1){
          alert("teacher");
          navigate("/teacher-dashboard");
          localStorage.setItem("token", data.token);
          document.cookie = `token=${data.token}; path=/;`;
        } else {
          alert("student");
          navigate("/student-dashboard");
          localStorage.setItem("token", data.token);
          document.cookie = `token=${data.token}; path=/;`;
        }
        
      } else {
        alert();
      }
    } catch (error) {
      console.error("Ошибка при входе:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Вход</h2>
      <form onSubmit={handleLogin} style={styles.form}>
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
        <button type="submit" style={styles.button}>
          Войти
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register" style={styles.link}>Зарегистрируйтесь</Link>
      </p>
    </div>
  );
};

export default LoginPage;
