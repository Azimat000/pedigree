// frontend/src/components/PatientsTable.tsx

import React, { useEffect, useState } from "react";
import { getPatients } from "../api";
import "../styles/PatientsTable.css";

interface PatientsTableProps {
  token: string;
  onBack: () => void;
  onSelectPatient?: (patientId: number) => void;
}

const PatientsTable: React.FC<PatientsTableProps> = ({ token, onBack, onSelectPatient }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatients(token, search);
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading patients", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  return (
    <div className="patients-container">
      <div className="patients-header">
        <button onClick={onBack} className="patients-back-btn">
          ← Назад
        </button>

        <input
          type="text"
          placeholder="Поиск по ФИО или СНИЛС"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="patients-search"
        />
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="patients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>СНИЛС</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr className="empty">
                <td colSpan={3}>Нет данных</td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPatient && onSelectPatient(p.id)}
                >
                  <td>{p.id}</td>
                  <td>
                    {`${p.family_name || ""} ${p.given_name || ""} ${
                      p.middle_name || ""
                    }`}
                  </td>
                  <td>{p.snils || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PatientsTable;
