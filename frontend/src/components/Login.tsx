// frontend/src/components/Login.tsx

import React, { useState } from "react";
import { login } from "../api";
import "../styles/auth.css";

const Login: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null); // очищаем прошлую ошибку
    try {
      const res = await login(email, password);
      if (res && res.access_token) {
        onLogin(res.access_token);
      } else {
        setError("Неправильный логин или пароль");
      }
    } catch (e) {
      setError("Попробуйте позже");
    }
  };

  return (
    <div className="auth-container">
      <h3>Авторизация</h3>
      <input
        className="auth-input"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="auth-input"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button className="auth-button" onClick={submit}>Вход</button>

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
};

export default Login;
