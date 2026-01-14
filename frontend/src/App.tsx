// frontend/src/App.tsx
import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Если нет токена – сразу в авторизацию и регистрацию
  if (!token) {
    return (
      <div>
        <header className="hero-header">
          <div className="hero-content">
            <img src="/logo.png" alt="МоиГены" className="hero-logo" />
            <h1 className="hero-title">МоиГены МВП</h1>
            <p className="hero-subtitle">Ваш помощник в медицинских исследованиях</p>
          </div>
        </header>

        <div className="auth-wrapper">
          <Login onLogin={(t) => setToken(t)} />
          <Register />
        </div>
      </div>
    );
  }

  // Если токен есть – грузим дашборд
  return <Dashboard token={token} onLogout={() => setToken(null)} />;
};

export default App;
