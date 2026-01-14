// frontend/src/components/PatientModal.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/patient-modal.css";

interface Trait {
  id?: number;
  name: string;
  onset_age?: number;
  details?: string;
}

interface Patient {
  id: number;
  given_name: string;
  family_name?: string;
  middle_name?: string;
  dob?: string;
  baseline_visit_date?: string;
  snils?: string;
  sex?: string;
  weight?: number;
  height?: number;
  notes?: string;
  family_hyperchol?: boolean;
  smoking?: boolean;
  hypertension?: boolean;
  diabetes?: boolean;
  mutations?: string;
  traits?: Trait[];
}

interface PatientModalProps {
  patientId: number | null;
  onClose: () => void;
  onSaved: () => void;
}

const PatientModal: React.FC<PatientModalProps> = ({ patientId, onClose, onSaved }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    axios
      .get(`http://localhost:8000/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setPatient(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleChange = (field: keyof Patient, value: any) => {
    if (!patient) return;
    setPatient({ ...patient, [field]: value });
  };

  const handleDelete = () => {
    if (!patient) return;
    if (!window.confirm("Удалить пациента безвозвратно?")) return;

    axios
      .delete(`http://localhost:8000/patients/${patient.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch((err) => console.error(err));
  };

  const handleSave = () => {
    if (!patient) return;
    setSaving(true);

    axios
      .put(`http://localhost:8000/patients/${patient.id}`, patient, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch((err) => console.error(err))
      .finally(() => setSaving(false));
  };

  if (!patientId) return null;
  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="patient-modal-overlay">
      <div className="patient-modal">
        <h2>
          {patient?.given_name} {patient?.family_name}
        </h2>

        <label>
          Имя:
          <input
            value={patient?.given_name || ""}
            onChange={(e) => handleChange("given_name", e.target.value)}
          />
        </label>

        <label>
          Фамилия:
          <input
            value={patient?.family_name || ""}
            onChange={(e) => handleChange("family_name", e.target.value)}
          />
        </label>

        <label>
          Отчество:
          <input
            value={patient?.middle_name || ""}
            onChange={(e) => handleChange("middle_name", e.target.value)}
          />
        </label>

        <label>
          Дата рождения:
          <input
            type="date"
            value={patient?.dob || ""}
            onChange={(e) => handleChange("dob", e.target.value)}
          />
        </label>

        <label>
          Дата первичного визита:
          <input
            type="date"
            value={patient?.baseline_visit_date || ""}
            onChange={(e) => handleChange("baseline_visit_date", e.target.value)}
          />
        </label>

        <label>
          СНИЛС:
          <input
            value={patient?.snils || ""}
            onChange={(e) => handleChange("snils", e.target.value)}
          />
        </label>

        <label>
          Пол:
          <select
            value={patient?.sex || ""}
            onChange={(e) => handleChange("sex", e.target.value)}
          >
            <option value="">Выберите...</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </label>

        <label>
          Вес (кг):
          <input
            type="number"
            value={patient?.weight || ""}
            onChange={(e) => handleChange("weight", e.target.value)}
          />
        </label>

        <label>
          Рост (см):
          <input
            type="number"
            value={patient?.height || ""}
            onChange={(e) => handleChange("height", e.target.value)}
          />
        </label>

        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={!!patient?.family_hyperchol}
            onChange={(e) => handleChange("family_hyperchol", e.target.checked)}
          />
          Семейная гиперхолестеринемия
        </label>

        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={!!patient?.smoking}
            onChange={(e) => handleChange("smoking", e.target.checked)}
          />
          Курение
        </label>

        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={!!patient?.hypertension}
            onChange={(e) => handleChange("hypertension", e.target.checked)}
          />
          Гипертония
        </label>

        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={!!patient?.diabetes}
            onChange={(e) => handleChange("diabetes", e.target.checked)}
          />
          Диабет
        </label>

        <label>
          Мутации:
          <input
            value={patient?.mutations || ""}
            onChange={(e) => handleChange("mutations", e.target.value)}
          />
        </label>

        <label>
          Примечания:
          <textarea
            value={patient?.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </label>

        <div className="patient-modal-actions">
          <button className="patient-btn patient-btn-close" onClick={onClose}>
            Закрыть
          </button>
          <button className="patient-btn patient-btn-delete" onClick={handleDelete}>
            Удалить
          </button>
          <button
            className="patient-btn patient-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientModal;
