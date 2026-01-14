// frontend/src/components/Register.tsx

import React, { useState } from "react";
import { register } from "../api";
import "../styles/auth.css";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await register(email, password, "", role);
      if (res && res.id) {
        setSuccessMsg("Регистрация прошла успешно. Вы можете авторизоваться");
      } else {
        setErrorMsg(res?.message || "Пожалуйста введите корректный email.");
      }
    } catch (e: any) {
      setErrorMsg(e?.message || String(e));
    }
  };

  return (
    <div className="auth-container">
      <h3>Регистрация</h3>
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
      <select
        className="auth-select"
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="doctor">Врач</option>
        <option value="admin">Администратор</option>
      </select>
      <button className="auth-button" onClick={submit}>Зарегистрироваться</button>

      {successMsg && <div className="auth-message">{successMsg}</div>}
      {errorMsg && <div className="auth-error">{errorMsg}</div>}
    </div>
  );
};

export default Register;
