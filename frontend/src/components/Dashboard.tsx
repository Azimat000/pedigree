// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import PatientsTable from "./PatientsTable";
import {
  createPatient,
  createRelation,
  createLink,
  getPedigree,
} from "../api";
import PedigreeGraph from "./PedigreeGraph";
import "../styles/Dashboard.css";
import Modal from "./Modal";

const Dashboard: React.FC<{ token: string; onLogout: () => void }> = ({
  token,
  onLogout,
}) => {
  const [showTable, setShowTable] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [pedigree, setPedigree] = useState<any | null>(null);

  // --- форма создания пациента ---
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [dob, setDob] = useState("");
  const [baselineVisitDate, setBaselineVisitDate] = useState("");
  const [snils, setSnils] = useState("");
  const [sex, setSex] = useState("");
  const [familyHyperchol, setFamilyHyperchol] = useState(false);
  const [mutations, setMutations] = useState("");
  const [smoking, setSmoking] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  // --- форма для добавления связей ---
  const [relationParentId, setRelationParentId] = useState("");
  const [relationChildId, setRelationChildId] = useState("");

  const [linkP1, setLinkP1] = useState("");
  const [linkP2, setLinkP2] = useState("");
  const [linkType, setLinkType] = useState("sibling");

  // --- уведомления ---
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  // Автоматическое скрытие сообщений
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000); // <-- теперь 3 секунды
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const showUserMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleCreatePatient = async () => {
    const patient = {
      given_name: givenName,
      family_name: familyName,
      middle_name: middleName,
      dob: dob || null,
      baseline_visit_date: baselineVisitDate || null,
      snils: snils || null,
      sex,
      family_hyperchol: familyHyperchol,
      mutations,
      smoking,
      hypertension,
      diabetes,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      notes,
    };
    try {
      await createPatient(token, patient);
      showUserMessage("Пациент успешно создан", "success");
    } catch (err) {
      console.error("Ошибка при создании пациента", err);
      showUserMessage("Ошибка при создании пациента", "error");
    }
  };

  const handleCreateRelation = async () => {
    try {
      await createRelation(token, {
        parent_id: parseInt(relationParentId, 10),
        child_id: parseInt(relationChildId, 10),
      });
      showUserMessage("Связь родитель–ребёнок успешно добавлена", "success");
    } catch (err) {
      console.error("Ошибка при создании связи", err);
      showUserMessage("Ошибка при создании связи", "error");
    }
  };

  const handleCreateLink = async () => {
    try {
      await createLink(token, {
        patient1_id: parseInt(linkP1, 10),
        patient2_id: parseInt(linkP2, 10),
        link_type: linkType,
      });
      showUserMessage("Горизонтальная/супружеская связь успешно добавлена", "success");
    } catch (err) {
      console.error("Ошибка при создании линка", err);
      showUserMessage("Ошибка при создании линка", "error");
    }
  };

  const handleSelectPatient = async (patientId: number) => {
    setSelectedPatientId(patientId);
    try {
      const data = await getPedigree(token, patientId);
      setPedigree(data);
      setShowTable(false);
    } catch (err) {
      console.error("Ошибка при загрузке дерева", err);
      showUserMessage("Ошибка при загрузке генеалогического дерева", "error");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Верхняя панель */}
      <div className="dashboard-header">
        <h1>Панель управления</h1>
        <button onClick={onLogout} className="dashboard-logout">
          Выйти
        </button>
      </div>

      {/* Сообщения пользователю */}
      {message && (
        <div
          className={`toast-message ${
            messageType === "error" ? "toast-error" : "toast-success"
          }`}
        >
          {message}
        </div>
      )}

      {/* Форма добавления пациента */}
      <div className="dashboard-section">
        <h2>Создание пациента</h2>
        <div className="dashboard-grid">
          <input
            placeholder="Имя"
            value={givenName}
            onChange={(e) => setGivenName(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="Фамилия"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="Отчество"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="dashboard-input"
          />
          <input
            type="date"
            placeholder="Дата рождения"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="dashboard-input"
          />
          <input
            type="date"
            placeholder="Базовый визит"
            value={baselineVisitDate}
            onChange={(e) => setBaselineVisitDate(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="СНИЛС"
            value={snils}
            onChange={(e) => setSnils(e.target.value)}
            className="dashboard-input"
          />
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="dashboard-select"
          >
            <option value="">Пол</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
          <input
            placeholder="Мутации"
            value={mutations}
            onChange={(e) => setMutations(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="Вес"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="Рост"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="dashboard-input"
          />
        </div>
        <textarea
          placeholder="Примечания"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="dashboard-textarea"
        />

        {/* Чекбоксы */}
        <div className="dashboard-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={familyHyperchol}
              onChange={(e) => setFamilyHyperchol(e.target.checked)}
            />
            Семейная гиперхолестеринемия
          </label>
          <label>
            <input
              type="checkbox"
              checked={smoking}
              onChange={(e) => setSmoking(e.target.checked)}
            />
            Курение
          </label>
          <label>
            <input
              type="checkbox"
              checked={hypertension}
              onChange={(e) => setHypertension(e.target.checked)}
            />
            Гипертония
          </label>
          <label>
            <input
              type="checkbox"
              checked={diabetes}
              onChange={(e) => setDiabetes(e.target.checked)}
            />
            Диабет
          </label>
        </div>

        <button onClick={handleCreatePatient} className="dashboard-button">
          Создать пациента
        </button>
      </div>

      {/* Добавление связей */}
      <div className="dashboard-section">
        <h2>Добавление связей</h2>
        <div className="dashboard-toggle-group">
          <input
            placeholder="ID Родителя"
            value={relationParentId}
            onChange={(e) => setRelationParentId(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="ID Ребенка"
            value={relationChildId}
            onChange={(e) => setRelationChildId(e.target.value)}
            className="dashboard-input"
          />
          <button
            onClick={handleCreateRelation}
            className="dashboard-button dashboard-button-green"
          >
            Добавить Родитель/Ребенок
          </button>
        </div>

        <div className="dashboard-toggle-group" style={{ marginTop: "12px" }}>
          <input
            placeholder="ID первого пациента"
            value={linkP1}
            onChange={(e) => setLinkP1(e.target.value)}
            className="dashboard-input"
          />
          <input
            placeholder="ID второго пациента"
            value={linkP2}
            onChange={(e) => setLinkP2(e.target.value)}
            className="dashboard-input"
          />
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="dashboard-select"
          >
            <option value="sibling">Братья/Сестры</option>
            <option value="spouse">Супруги</option>
          </select>
          <button
            onClick={handleCreateLink}
            className="dashboard-button dashboard-button-purple"
          >
            Добавить связь
          </button>
        </div>
      </div>

      {/* Переключатель */}
      <div className="dashboard-toggle-group">
        <button
          onClick={() => {
            setShowTable(true);
            setSelectedPatientId(null);
          }}
          className="dashboard-toggle"
        >
          Показать таблицу пациентов
        </button>
      </div>
  
      {/* Таблица теперь в модальном окне */}
      <Modal isOpen={showTable} onClose={() => setShowTable(false)}>
        <PatientsTable
          token={token}
          onBack={() => setShowTable(false)}
          onSelectPatient={handleSelectPatient}
        />
      </Modal>
  
      {/* Отображение генограммы */}
      <Modal
        isOpen={!!(selectedPatientId && pedigree)}
        onClose={() => setSelectedPatientId(null)}
      >
        {selectedPatientId && pedigree && (
          <div className="pedigree-container">
            <h2>Генограмма пациента {selectedPatientId}</h2>
            <PedigreeGraph data={pedigree} width={1000} height={600} />
          </div>
        )}
      </Modal>
  
      {!showTable && !selectedPatientId && (
        <p>Выберите пациента в таблице для отображения генеалогического дерева</p>
      )}
    </div>
  );
};

export default Dashboard;
