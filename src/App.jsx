import { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";
import HorasPage from "./HorasPage";
import { supabase } from "./supabaseClient";

/* ─── NEW PHASE STRUCTURE ─── */

const PHASE_META = [
  { key: "f1", label: "F1", name: "Análisis y Planificación",               color: "#1BA8A0", light: "#E0F5F4" },
  { key: "f2", label: "F2", name: "Diseño, Desarrollo y Pruebas Técnicas",  color: "#1E5C8A", light: "#D6E8F5" },
  { key: "f3", label: "F3", name: "Validación del Negocio y Calidad",       color: "#5B3FA8", light: "#EAE5F8" },
  { key: "f4", label: "F4", name: "Cierre, Operación y Mejora Continua",    color: "#1A3A5C", light: "#D4E0EC" },
];

/* Subfases template — used for new activities and defaults */
const SUBFASES_TEMPLATE = [
  // F1 — Análisis y Planificación
  {
    phase: "F1",
    title: "Levantamiento y Análisis de Requerimientos",
    desc: "Identificación de necesidades del negocio, stakeholders y alcance.",
    status: "pending",
  },
  {
    phase: "F1",
    title: "Planificación del Proyecto",
    desc: "Definición de cronograma, recursos, riesgos y roadmap.",
    status: "pending",
  },
  // F2 — Diseño, Desarrollo y Pruebas Técnicas
  {
    phase: "F2",
    title: "Diseño de Arquitectura y Especificación Técnica",
    desc: "Definición de arquitectura, base de datos, APIs e infraestructura.",
    status: "pending",
  },
  {
    phase: "F2",
    title: "Desarrollo / Implementación (Coding)",
    desc: "Construcción del sistema conforme a estándares.",
    status: "pending",
  },
  {
    phase: "F2",
    title: "Pruebas Unitarias (White-Box Testing)",
    desc: "Validación interna del código por módulos.",
    status: "pending",
  },
  {
    phase: "F2",
    title: "Pruebas de Integración",
    desc: "Validación de interacción entre componentes del sistema.",
    status: "pending",
  },
  {
    phase: "F2",
    title: "Despliegue a Producción (Go-Live / Release)",
    desc: "Liberación inicial del sistema en entorno productivo.",
    status: "pending",
  },
  // F3 — Validación del Negocio y Calidad
  {
    phase: "F3",
    title: "Pruebas del Sistema (System Testing)",
    desc: "Evaluación completa del sistema en ambiente controlado.",
    status: "pending",
  },
  {
    phase: "F3",
    title: "Pruebas de Aceptación del Usuario (UAT)",
    desc: "Validación funcional por parte del usuario o responsable del proceso (Process Owner).",
    status: "pending",
  },
  // F4 — Cierre, Operación y Mejora Continua
  {
    phase: "F4",
    title: "Validación Post-Implementación",
    desc: "Verificación del correcto funcionamiento en producción.",
    status: "pending",
  },
  {
    phase: "F4",
    title: "Mantenimiento, Ajustes y Mejora Continua",
    desc: "Corrección de errores, optimización y evolución del sistema.",
    status: "pending",
  },
  {
    phase: "F4",
    title: "Lecciones Aprendidas",
    desc: "Documentación de hallazgos, buenas prácticas y áreas de mejora identificadas durante el proyecto, con el objetivo de optimizar futuros desarrollos.",
    status: "pending",
  },
];

const TOTAL_SUBFASES = SUBFASES_TEMPLATE.length; // 12

function makeDefaultSubfases() {
  return SUBFASES_TEMPLATE.map(s => ({ ...s }));
}

const STATUS_OPTIONS = ["pending", "active", "done"];
const STATUS_LABEL   = { pending: "Pendiente", active: "En curso", done: "Completado" };

const MONTHS = ["May","Jun","Jul","Ago","Sep"];
const TOTAL_DAYS = 153;

const DEFAULT_ACTIVITIES = [
  {
    id: 1, name: "Capacitación y adiestramiento",
    inicio: "08/04", fin: "09/05", dias: 31,
    owner: "RH", ownerKey: "rh", status: "active", progress: 60,
    ganttStart: 0, ganttEnd: 31,
    phases: makeDefaultSubfases(),
  },
  {
    id: 2, name: "Calibración",
    inicio: "01/05", fin: "15/05", dias: 14,
    owner: "Jesús", ownerKey: "jesus", status: "active", progress: 40,
    ganttStart: 30, ganttEnd: 58,
    phases: makeDefaultSubfases(),
  },
  {
    id: 3, name: "KPI's",
    inicio: "08/05", fin: "08/06", dias: 31,
    owner: "Jesús", ownerKey: "jesus", status: "pending", progress: 10,
    ganttStart: 37, ganttEnd: 93,
    phases: makeDefaultSubfases(),
  },
  {
    id: 4, name: "Inducción",
    inicio: "15/05", fin: "15/06", dias: 31,
    owner: "RH", ownerKey: "rh", status: "pending", progress: 0,
    ganttStart: 44, ganttEnd: 100,
    phases: makeDefaultSubfases(),
  },
  {
    id: 5, name: "RAP Genética",
    inicio: "01/05", fin: "15/09", dias: 137,
    owner: "Ángel / Genética", ownerKey: "angel", status: "active", progress: 25,
    ganttStart: 30, ganttEnd: 167,
    phases: makeDefaultSubfases(),
  },
  {
    id: 6, name: "CyA Genética",
    inicio: "15/06", fin: "15/08", dias: 61,
    owner: "Genética", ownerKey: "gen", status: "pending", progress: 0,
    ganttStart: 75, ganttEnd: 140,
    phases: makeDefaultSubfases(),
  },
  {
    id: 7, name: "Cal. Genética",
    inicio: "01/07", fin: "15/09", dias: 76,
    owner: "Genética", ownerKey: "gen", status: "pending", progress: 0,
    ganttStart: 91, ganttEnd: 152,
    phases: makeDefaultSubfases(),
  },
];

/* ─── Supabase helpers ─── */

function rowToActivity(row) {
  return {
    id:         row.id,
    name:       row.name,
    owner:      row.owner,
    ownerKey:   row.owner_key,
    inicio:     row.inicio,
    fin:        row.fin,
    dias:       row.dias,
    status:     row.status,
    progress:   row.progress,
    ganttStart: row.gantt_start,
    ganttEnd:   row.gantt_end,
    phases:     row.phases,
  };
}

function activityToRow(act) {
  return {
    name:        act.name,
    owner:       act.owner,
    owner_key:   act.ownerKey,
    inicio:      act.inicio,
    fin:         act.fin,
    dias:        act.dias,
    status:      act.status,
    progress:    act.progress,
    gantt_start: act.ganttStart,
    gantt_end:   act.ganttEnd,
    phases:      act.phases,
  };
}

async function fetchActivities() {
  const { data, error } = await supabase
    .from("pm_activities")
    .select("*")
    .order("id");
  if (error) throw error;
  return data.map(rowToActivity);
}

async function upsertActivity(act) {
  const row = activityToRow(act);
  if (act.id && typeof act.id === "number") {
    const { error } = await supabase
      .from("pm_activities")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", act.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("pm_activities")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
}

async function deleteActivityDB(id) {
  const { error } = await supabase.from("pm_activities").delete().eq("id", id);
  if (error) throw error;
}

async function seedDefaults() {
  const rows = DEFAULT_ACTIVITIES.map(a => activityToRow(a));
  const { error } = await supabase.from("pm_activities").insert(rows);
  if (error) throw error;
  return fetchActivities();
}

/* ─── small helpers ─── */

function ownerInitials(o) {
  return o.split(/[\s/]+/).map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function IspLogo() {
  return (
    <img src="/isp.jpg" alt="ISP Logo"
      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
}

/* ─── Helper: compute phase-level progress from subfases ─── */
function getPhaseProgress(phases) {
  const result = {};
  PHASE_META.forEach(pm => {
    const key = pm.label;
    const subs = (phases || []).filter(s => s.phase === key);
    if (subs.length === 0) { result[key] = { done: 0, total: 0, pct: 0 }; return; }
    const done = subs.filter(s => s.status === "done").length;
    result[key] = { done, total: subs.length, pct: Math.round((done / subs.length) * 100) };
  });
  return result;
}

/* ─── Editable ─── */

function Editable({ value, onChange, className = "", multiline = false, style = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };
  const cancel = () => { setEditing(false); setDraft(value); };
  if (editing) {
    const props = {
      className: "edit-input " + className, value: draft, autoFocus: true,
      onChange: e => setDraft(e.target.value), onBlur: commit,
      onKeyDown: e => { if (e.key === "Enter" && !multiline) commit(); if (e.key === "Escape") cancel(); },
      style,
    };
    return multiline ? <textarea rows={3} {...props} /> : <input {...props} />;
  }
  return (
    <span className={"editable " + className} onClick={() => { setDraft(value); setEditing(true); }} title="Clic para editar" style={style}>
      {value}<span className="edit-pencil">✎</span>
    </span>
  );
}

function StatusCycle({ status, onChange }) {
  const next = () => { const i = STATUS_OPTIONS.indexOf(status); onChange(STATUS_OPTIONS[(i + 1) % STATUS_OPTIONS.length]); };
  return (
    <button className={`sbadge sbadge--${status}`} onClick={next} title="Clic para cambiar estatus">
      <span className="sbadge__dot" />{STATUS_LABEL[status]}<span className="sbadge__cycle">↻</span>
    </button>
  );
}

/* ─── Progress bar showing 4 phases with subfase-based fill ─── */

function ProgressEditor({ phases, progress, status, onChange }) {
  const phProg = getPhaseProgress(phases);
  return (
    <div className="prog-wrap">
      <div className="prog-top">
        <div className="prog-phases">
          {PHASE_META.map((m) => {
            const pp = phProg[m.label];
            const filled = pp.pct > 0;
            const full   = pp.pct === 100;
            const bgStyle = (filled || full)
              ? { backgroundColor: m.color, color: "#fff", opacity: full ? 1 : 0.7 }
              : { backgroundColor: "#EBF0F5", color: "#7A95AE", border: "1px solid rgba(26,58,92,0.16)" };
            return (
              <div key={m.key} className="prog-seg" style={bgStyle} title={`${m.label}: ${pp.done}/${pp.total}`}>
                {m.label}
              </div>
            );
          })}
        </div>
        <span className="prog-pct">{progress}%</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={progress}
        onChange={e => onChange(Number(e.target.value))}
        className="prog-slider" title="Arrastra para cambiar progreso" />
    </div>
  );
}

/* ─── Phase Panel: grouped by F1–F4 with subfases inside ─── */

function PhasePanel({ phases, onUpdate }) {
  const grouped = {};
  PHASE_META.forEach(pm => { grouped[pm.label] = []; });
  (phases || []).forEach((sub, i) => {
    if (grouped[sub.phase]) grouped[sub.phase].push({ ...sub, _idx: i });
  });

  return (
    <div className="panel-phases-v2">
      {PHASE_META.map(pm => {
        const subs = grouped[pm.label];
        const doneCount = subs.filter(s => s.status === "done").length;
        return (
          <div key={pm.key} className="phase-group" style={{ "--ph-color": pm.color, "--ph-light": pm.light }}>
            <div className="phase-group__header">
              <span className="phase-group__tag" style={{ background: pm.color }}>{pm.label}</span>
              <span className="phase-group__name">{pm.name}</span>
              <span className="phase-group__count">{doneCount}/{subs.length}</span>
            </div>
            <div className="phase-group__subs">
              {subs.map(sub => (
                <div key={sub._idx} className={`subfase-card subfase-card--${sub.status}`} style={{ "--ph-color": pm.color, "--ph-light": pm.light }}>
                  <div className="subfase-card__bar" />
                  <div className="subfase-card__body">
                    <div className="subfase-card__top">
                      <Editable className="subfase-card__title" value={sub.title} onChange={v => onUpdate(sub._idx, "title", v)} />
                      <StatusCycle status={sub.status} onChange={v => onUpdate(sub._idx, "status", v)} />
                    </div>
                    <Editable className="subfase-card__desc" value={sub.desc} multiline onChange={v => onUpdate(sub._idx, "desc", v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityRow({ act, isOpen, onToggle, onUpdate, editMode }) {
  const upAct  = (field, val) => onUpdate(act.id, field, val);
  const upPhase = (pi, field, val) => {
    const phases = act.phases.map((p, i) => i === pi ? { ...p, [field]: val } : p);
    onUpdate(act.id, "phases", phases);
  };
  return (
    <div className={`act-row ${isOpen ? "act-row--open" : ""}`}>
      <div className="act-row__main" onClick={onToggle} role="button" tabIndex={0}
        aria-expanded={isOpen} onKeyDown={e => e.key === "Enter" && onToggle()}>
        <div className="cell cell--num" onClick={e => e.stopPropagation()}>
          <span className="act-num">{String(act.id).padStart(2,"00")}</span>
        </div>
        <div className="cell cell--name" onClick={e => editMode && e.stopPropagation()}>
          <div className="act-name-wrap">
            {editMode ? <Editable className="act-name" value={act.name} onChange={v => upAct("name", v)} /> : <span className="act-name">{act.name}</span>}
            <span className={`owner-chip owner-chip--${act.ownerKey}`}>
              <span className="owner-av">{ownerInitials(act.owner)}</span>
              {editMode ? <Editable className="owner-txt" value={act.owner} onChange={v => upAct("owner", v)} /> : <span className="owner-txt">{act.owner}</span>}
            </span>
          </div>
        </div>
        <div className="cell cell--date" onClick={e => editMode && e.stopPropagation()}>
          <div className="date-block">
            <span className="date-lbl">Inicio</span>
            {editMode ? <Editable className="date-val" value={act.inicio} onChange={v => upAct("inicio", v)} /> : <span className="date-val">{act.inicio}</span>}
          </div>
        </div>
        <div className="cell cell--date" onClick={e => editMode && e.stopPropagation()}>
          <div className="date-block">
            <span className="date-lbl">Fin</span>
            {editMode ? <Editable className="date-val" value={act.fin} onChange={v => upAct("fin", v)} /> : <span className="date-val">{act.fin}</span>}
          </div>
        </div>
        <div className="cell cell--dias" onClick={e => editMode && e.stopPropagation()}>
          <div className="dias-block">
            {editMode ? <Editable className="dias-num" value={String(act.dias)} onChange={v => upAct("dias", parseInt(v)||0)} /> : <span className="dias-num">{act.dias}</span>}
            <span className="dias-lbl">días</span>
          </div>
        </div>
        <div className="cell cell--status hide-sm" onClick={e => e.stopPropagation()}>
          <StatusCycle status={act.status} onChange={v => upAct("status", v)} />
        </div>
        <div className="cell cell--progress" onClick={e => editMode && e.stopPropagation()}>
          <ProgressEditor phases={act.phases} progress={act.progress} status={act.status} onChange={v => upAct("progress", v)} />
        </div>
        <div className="cell cell--chevron">
          <span className={`chevron ${isOpen ? "chevron--open" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="act-row__panel">
          <div className="panel-inner">
            <PhasePanel phases={act.phases} onUpdate={upPhase} />
            <div className="panel-progress">
              <div className="panel-prog-lbl">
                <span>Progreso general</span>
                <span className="panel-pct">{act.progress}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={act.progress}
                onChange={e => upAct("progress", Number(e.target.value))}
                className="prog-slider prog-slider--lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GanttBarNew({ act }) {
  const left     = Math.min((act.ganttStart / TOTAL_DAYS) * 100, 100);
  const width    = Math.min(((act.ganttEnd - act.ganttStart) / TOTAL_DAYS) * 100, 100 - left);
  const progFrac = act.progress / 100;
  return (
    <div style={{
      position: "absolute", top: "50%", transform: "translateY(-50%)",
      left: `${left.toFixed(3)}%`, width: `${width.toFixed(3)}%`,
      height: "44px", borderRadius: "8px", overflow: "hidden", display: "flex",
      boxShadow: "0 1px 4px rgba(26,58,92,0.12)",
    }}>
      {PHASE_META.map((ph, i) => {
        const filled = Math.min(1, Math.max(0, (progFrac - i * 0.25) / 0.25));
        return (
          <div key={ph.key} title={`${ph.label} · ${ph.name}`}
            style={{ flex: 1, position: "relative", overflow: "hidden",
              backgroundColor: ph.color + "22",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.3)" : "none" }}>
            {filled > 0 && (
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${(filled * 100).toFixed(1)}%`, backgroundColor: ph.color }} />
            )}
            <div style={{ position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 2 }}>
              <span style={{ fontSize: "10px", fontWeight: 700,
                color: filled > 0.45 ? "rgba(255,255,255,0.95)" : ph.color }}>
                {ph.label}
              </span>
            </div>
          </div>
        );
      })}
      {act.progress > 0 && (
        <div style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
          fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.9)",
          backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "3px", padding: "1px 5px",
          zIndex: 3, pointerEvents: "none" }}>
          {act.progress}%
        </div>
      )}
    </div>
  );
}

function GanttSection({ activities, onUpdate, editMode }) {
  const handleDrop = useCallback((e, areaWidth) => {
    e.preventDefault();
    try {
      const { id, type, x: startX } = JSON.parse(e.dataTransfer.getData("text/plain"));
      const dx = e.clientX - startX;
      const daysDelta = Math.round((dx / areaWidth) * TOTAL_DAYS);
      const act = activities.find(a => a.id === id);
      if (!act) return;
      if (type === "move") {
        const newStart = Math.max(0, Math.min(TOTAL_DAYS - 1, act.ganttStart + daysDelta));
        const dur = act.ganttEnd - act.ganttStart;
        onUpdate(id, "ganttStart", newStart);
        onUpdate(id, "ganttEnd", Math.min(TOTAL_DAYS, newStart + dur));
      } else if (type === "start") {
        onUpdate(id, "ganttStart", Math.max(0, Math.min(act.ganttEnd - 1, act.ganttStart + daysDelta)));
      } else {
        onUpdate(id, "ganttEnd", Math.max(act.ganttStart + 1, Math.min(TOTAL_DAYS, act.ganttEnd + daysDelta)));
      }
    } catch {}
  }, [activities, onUpdate]);

  return (
    <div className="gantt-card">
      <div className="gantt-card__header">
        <div className="gantt-title-row">
          <span className="gantt-title">Cronograma Gantt</span>
          <span className="gantt-range">Mayo – Septiembre 2026</span>
        </div>
        {editMode && <p className="gantt-edit-hint">Arrastra las barras para mover · Arrastra los extremos para cambiar duración</p>}
        <div className="gantt-legend">
          {PHASE_META.map(m => (
            <div key={m.key} className="g-leg-item">
              <div className="g-leg-dot" style={{ background: m.color }} />
              <span>{m.label} — {m.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gantt-scroll">
        <div className="gantt-inner">
          <div className="gantt-month-row">
            <div className="gantt-label-col" />
            {MONTHS.map(m => (
              <div key={m} className="gantt-month-cell">
                <div className="gantt-month-name">{m}</div>
              </div>
            ))}
          </div>
          {activities.map((act, ai) => (
            <div key={act.id} className={`gantt-row ${ai % 2 === 0 ? "gantt-row--even" : ""}`}>
              <div className="gantt-label-col">
                <span className="gantt-act-num">{String(act.id).padStart(2,"00")}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="gantt-act-name">{act.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "1px" }}>{act.inicio} – {act.fin}</div>
                </div>
              </div>
              <div className="gantt-bars-area"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { const rect = e.currentTarget.getBoundingClientRect(); handleDrop(e, rect.width); }}>
                {[1,2,3,4].map(i => <div key={i} className="gantt-divider" style={{ left: `${(i/5)*100}%` }} />)}
                <GanttBarNew act={act} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddModal({ onAdd, onClose }) {
  const [name, setName] = useState(""); const [owner, setOwner] = useState("");
  const [inicio, setInicio] = useState(""); const [fin, setFin] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nueva actividad</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field-label">Nombre de la actividad</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Auditoría de sistemas" />
          <label className="field-label">Responsable</label>
          <input className="field-input" value={owner} onChange={e => setOwner(e.target.value)} placeholder="Ej. RH, Jesús, Genética…" />
          <div className="field-row">
            <div><label className="field-label">Inicio</label><input className="field-input" value={inicio} onChange={e => setInicio(e.target.value)} placeholder="dd/mm" /></div>
            <div><label className="field-label">Fin</label><input className="field-input" value={fin} onChange={e => setFin(e.target.value)} placeholder="dd/mm" /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-add" onClick={() => { if (!name.trim()) return; onAdd({ name: name.trim(), owner: owner || "—", inicio: inicio || "—", fin: fin || "—" }); onClose(); }}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */

export default function App() {
  const [page, setPage]           = useState("plan");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [openId,  setOpenId]      = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState(null);

  const saveTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        let data = await fetchActivities();
        if (data.length === 0) {
          data = await seedDefaults();
        }
        setActivities(data);
      } catch (err) {
        console.error("Error loading activities:", err);
        setError("Error al conectar con la base de datos. Usando datos locales.");
        setActivities(DEFAULT_ACTIVITIES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveActivityToDB = useCallback((act) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await upsertActivity(act);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      } catch (err) {
        console.error("Error saving activity:", err);
      }
    }, 500);
  }, []);

  const toggle = id => setOpenId(prev => prev === id ? null : id);

  const updateActivity = useCallback((id, field, val) => {
    setActivities(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, [field]: val } : a);
      const act = updated.find(a => a.id === id);
      if (act) saveActivityToDB(act);
      return updated;
    });
  }, [saveActivityToDB]);

  const resetData = async () => {
    if (!window.confirm("¿Resetear todo al estado original? Se borrarán todas las actividades de la base de datos.")) return;
    try {
      await supabase.from("pm_activities").delete().neq("id", 0);
      const data = await seedDefaults();
      setActivities(data);
    } catch (err) {
      console.error("Error resetting:", err);
    }
  };

  const addActivity = async ({ name, owner, inicio, fin }) => {
    const newAct = {
      name, owner, ownerKey: "gen", inicio, fin, dias: 30,
      status: "pending", progress: 0, ganttStart: 0, ganttEnd: 30,
      phases: makeDefaultSubfases(),
    };
    try {
      const newId = await upsertActivity(newAct);
      setActivities(prev => [...prev, { ...newAct, id: newId }]);
    } catch (err) {
      console.error("Error adding activity:", err);
    }
  };

  const deleteActivity = async (id) => {
    try {
      await deleteActivityDB(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      if (openId === id) setOpenId(null);
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  const activeCount = activities.filter(a => a.status === "active").length;
  const doneSubfases = activities.flatMap(a => a.phases || []).filter(p => p.status === "done").length;
  const totalSubfases = activities.length * TOTAL_SUBFASES;

  if (page === "horas") return <HorasPage onBack={() => setPage("plan")} />;

  if (loading) {
    return (
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#7A95AE" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>Cargando plan maestro…</div>
          <div style={{ fontSize: 14 }}>Conectando con Supabase</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showModal && <AddModal onAdd={addActivity} onClose={() => setShowModal(false)} />}

      <header className="app-header">
        <div className="app-header__brand">
          <IspLogo />
          <div>
            <div className="brand-name">ISP · Infraestructura y Servicios Portuarios</div>
            <h1 className="app-title">Plan maestro de desarrollo de software</h1>
          </div>
        </div>
        <div className="app-header__actions">
          <div className="action-btns">
            {saved && <span className="saved-toast">✓ Guardado en la nube</span>}
            {error && <span className="saved-toast" style={{ background: "#FEE2E2", color: "#DC2626" }}>{error}</span>}
            <button className="btn-horas" onClick={() => setPage("horas")}>
              ⏱ Registro de horas
            </button>
            <button className={`btn-edit ${editMode ? "btn-edit--on" : ""}`} onClick={() => setEditMode(v => !v)}>
              {editMode ? "✓ Listo" : "✎ Editar plan"}
            </button>
            {editMode && <button className="btn-new" onClick={() => setShowModal(true)}>+ Nueva actividad</button>}
            {editMode && <button className="btn-reset" onClick={resetData}>↺ Reset</button>}
          </div>
        </div>
        <div className="app-kpis">
          <div className="kpi"><span className="kpi__val">{activities.length}</span><span className="kpi__lbl">Actividades</span></div>
          <div className="kpi kpi--teal"><span className="kpi__val">{activeCount}</span><span className="kpi__lbl">En curso</span></div>
          <div className="kpi kpi--navy"><span className="kpi__val">{doneSubfases}<span className="kpi__total">/{totalSubfases}</span></span><span className="kpi__lbl">Subfases listas</span></div>
        </div>
      </header>

      {editMode && (
        <div className="edit-banner">
          <span className="edit-banner__icon">✎</span>
          Modo edición activo — haz clic en cualquier texto para editarlo · usa los sliders para el progreso · el estatus cambia al hacer clic en el badge
        </div>
      )}

      <section className="matrix-section">
        <div className="matrix">
          <div className="matrix-head">
            <div className="hcol hcol--num">#</div>
            <div className="hcol hcol--name">Actividad · Responsable</div>
            <div className="hcol hcol--date">Inicio</div>
            <div className="hcol hcol--date">Fin</div>
            <div className="hcol hcol--dias">Días</div>
            <div className="hcol hcol--status hide-sm">Estatus</div>
            <div className="hcol hcol--progress">Progreso</div>
            <div className="hcol hcol--chevron" />
          </div>
          {activities.map(act => (
            <div key={act.id} className="act-row-wrapper">
              <ActivityRow act={act} isOpen={openId === act.id} onToggle={() => toggle(act.id)}
                onUpdate={updateActivity} editMode={editMode} />
              {editMode && <button className="btn-delete" onClick={() => deleteActivity(act.id)} title="Eliminar actividad">✕</button>}
            </div>
          ))}
        </div>
      </section>

      <GanttSection activities={activities} onUpdate={updateActivity} editMode={editMode} />
    </div>
  );
}