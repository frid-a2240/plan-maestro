import { useState } from "react";
import "./Prioridad.css";

export default function Prioridad({ onBack }) {
  const [task, setTask] = useState("");
  const [prioridades, setPrioridades] = useState([]);

  const agregarPrioridad = () => {
    if (!task.trim()) return;

    const nueva = {
      id: Date.now(),
      text: task,
      done: false,
    };

    setPrioridades(prev => [nueva, ...prev]);
    setTask("");
  };

  const toggleDone = (id) => {
    setPrioridades(prev =>
      prev.map(p =>
        p.id === id ? { ...p, done: !p.done } : p
      )
    );
  };

  const eliminar = (id) => {
    setPrioridades(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="prioridad-page">

      <div className="prioridad-header">
        <div>
          <h1>🔥 Actividades Prioridad</h1>
          <p>Actividades críticas o urgentes</p>
        </div>

        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
      </div>

      <div className="prioridad-add">
        <input
          type="text"
          placeholder="Agregar actividad prioritaria..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarPrioridad()}
        />

        <button onClick={agregarPrioridad}>
          + Agregar
        </button>
      </div>

      <div className="prioridad-list">
        {prioridades.length === 0 && (
          <div className="prioridad-empty">
            No hay actividades prioritarias
          </div>
        )}

        {prioridades.map(item => (
          <div
            key={item.id}
            className={`prioridad-card ${item.done ? "done" : ""}`}
          >

            <div
              className="prioridad-check"
              onClick={() => toggleDone(item.id)}
            >
              {item.done ? "✓" : ""}
            </div>

            <div className="prioridad-text">
              {item.text}
            </div>

            <button
              className="prioridad-delete"
              onClick={() => eliminar(item.id)}
            >
              ✕
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}