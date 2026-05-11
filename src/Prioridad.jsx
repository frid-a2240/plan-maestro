import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./Prioridad.css";

export default function Prioridad({ onBack, activities = [] }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [prioridades, setPrioridades] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  /* ── Load from Supabase on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pm_prioridades")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        setPrioridades(
          data.map((r) => ({
            id: r.id,
            actId: r.act_id,
            name: r.name,
            owner: r.owner,
            inicio: r.inicio,
            fin: r.fin,
            dias: r.dias,
            status: r.status,
            progress: r.progress,
            done: r.done,
          }))
        );
      } catch (err) {
        console.error("Error loading prioridades:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Filter activities not yet added, matching query ── */
  const addedIds = new Set(prioridades.map((p) => p.actId));
  const filtered = activities.filter((a) => {
    if (addedIds.has(a.id)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.owner.toLowerCase().includes(q)
    );
  });

  /* ── Select an activity from dropdown ── */
  const seleccionar = async (act) => {
    const row = {
      act_id: act.id,
      name: act.name,
      owner: act.owner,
      inicio: act.inicio,
      fin: act.fin,
      dias: act.dias,
      status: act.status,
      progress: act.progress,
      done: false,
      sort_order: prioridades.length,
    };
    try {
      const { data, error } = await supabase
        .from("pm_prioridades")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      setPrioridades((prev) => [
        ...prev,
        {
          id: data.id,
          actId: act.id,
          name: act.name,
          owner: act.owner,
          inicio: act.inicio,
          fin: act.fin,
          dias: act.dias,
          status: act.status,
          progress: act.progress,
          done: false,
        },
      ]);
    } catch (err) {
      console.error("Error adding prioridad:", err);
    }
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  /* ── Add free-text entry ── */
  const agregarLibre = async () => {
    if (!query.trim()) return;
    const row = {
      act_id: null,
      name: query.trim(),
      owner: null,
      inicio: null,
      fin: null,
      dias: null,
      status: null,
      progress: null,
      done: false,
      sort_order: prioridades.length,
    };
    try {
      const { data, error } = await supabase
        .from("pm_prioridades")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      setPrioridades((prev) => [
        ...prev,
        {
          id: data.id,
          actId: null,
          name: query.trim(),
          owner: null,
          inicio: null,
          fin: null,
          dias: null,
          status: null,
          progress: null,
          done: false,
        },
      ]);
    } catch (err) {
      console.error("Error adding free prioridad:", err);
    }
    setQuery("");
  };

  /* ── Toggle done ── */
  const toggleDone = async (id) => {
    const item = prioridades.find((p) => p.id === id);
    if (!item) return;
    const newDone = !item.done;
    try {
      await supabase.from("pm_prioridades").update({ done: newDone }).eq("id", id);
    } catch (err) {
      console.error("Error toggling done:", err);
    }
    setPrioridades((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: newDone } : p))
    );
  };

  /* ── Delete ── */
  const eliminar = async (id) => {
    try {
      await supabase.from("pm_prioridades").delete().eq("id", id);
    } catch (err) {
      console.error("Error deleting prioridad:", err);
    }
    setPrioridades((prev) => prev.filter((p) => p.id !== id));
  };

  /* ── Drag-and-drop reorder ── */
  const [dragIdx, setDragIdx] = useState(null);

  const onDragStart = (idx) => setDragIdx(idx);

  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setPrioridades((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(idx, 0, moved);
      return copy;
    });
    setDragIdx(idx);
  };

  const onDragEnd = useCallback(() => {
    setDragIdx(null);
    /* Save new sort order to DB */
    prioridades.forEach((p, i) => {
      supabase
        .from("pm_prioridades")
        .update({ sort_order: i })
        .eq("id", p.id)
        .then(({ error }) => {
          if (error) console.error("Error updating sort_order:", error);
        });
    });
  }, [prioridades]);

  const STATUS_LABEL = {
    pending: "Pendiente",
    active: "En curso",
    done: "Completado",
  };

  if (loading) {
    return (
      <div className="prioridad-page" style={{ textAlign: "center", paddingTop: "4rem", color: "#7A95AE" }}>
        Cargando prioridades…
      </div>
    );
  }

  return (
    <div className="prioridad-page">
      <div className="prioridad-header">
        <div>
          <h1>Actividades Importantes</h1>
          <p className="prioridad-subtitle">
            Busca y selecciona del plan maestro las actividades que son prioridad.
          </p>
        </div>
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {/* ── Search / Add bar ── */}
      <div className="prioridad-add-wrap">
        <div className="prioridad-add">
          <div className="prioridad-input-wrap">
            <span className="prioridad-search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar actividad del plan o escribir nueva…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (filtered.length === 1) {
                    seleccionar(filtered[0]);
                  } else {
                    agregarLibre();
                  }
                }
                if (e.key === "Escape") setShowDropdown(false);
              }}
            />
          </div>
          <button className="btn-agregar-libre" onClick={agregarLibre}>
            + Agregar
          </button>
        </div>

        {/* ── Dropdown ── */}
        {showDropdown && filtered.length > 0 && (
          <div className="prioridad-dropdown" ref={dropdownRef}>
            <div className="dropdown-title">
              Actividades del plan ({filtered.length})
            </div>
            {filtered.map((act) => (
              <div
                key={act.id}
                className="dropdown-item"
                onClick={() => seleccionar(act)}
              >
                <div className="dropdown-item__left">
                  <span className="dropdown-item__num">
                    {String(act.id).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="dropdown-item__name">{act.name}</div>
                    <div className="dropdown-item__owner">{act.owner}</div>
                  </div>
                </div>
                <div className="dropdown-item__right">
                  <span className="dropdown-item__dates">
                    {act.inicio} → {act.fin}
                  </span>
                  <span
                    className={`dropdown-item__status dropdown-item__status--${act.status}`}
                  >
                    {STATUS_LABEL[act.status] || act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Priority list ── */}
      <div className="prioridad-list">
        {prioridades.length === 0 && (
          <div className="prioridad-empty">
            <div className="prioridad-empty__icon">📋</div>
            <div>No hay actividades prioritarias</div>
            <div className="prioridad-empty__hint">
              Busca arriba para agregar del plan maestro
            </div>
          </div>
        )}

        {prioridades.map((item, idx) => (
          <div
            key={item.id}
            className={`prioridad-card ${item.done ? "done" : ""} ${
              dragIdx === idx ? "dragging" : ""
            }`}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
          >
            <div className="prioridad-card__grip" title="Arrastra para reordenar">
              ⠿
            </div>

            <span className="prioridad-card__rank">{idx + 1}</span>

            <div
              className="prioridad-check"
              onClick={() => toggleDone(item.id)}
            >
              {item.done ? "✓" : ""}
            </div>

            <div className="prioridad-card__content">
              <div className="prioridad-card__name">{item.name}</div>

              {item.actId && (
                <div className="prioridad-card__meta">
                  <span className="prioridad-card__owner">{item.owner}</span>
                  <span className="prioridad-card__dates">
                    {item.inicio} → {item.fin}
                  </span>
                  <span className="prioridad-card__dias">
                    {item.dias} días
                  </span>
                  {item.status && (
                    <span
                      className={`prioridad-card__status prioridad-card__status--${item.status}`}
                    >
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  )}
                  <span className="prioridad-card__progress">
                    {item.progress}%
                  </span>
                </div>
              )}
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