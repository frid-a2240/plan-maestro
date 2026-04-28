import { useState, useEffect } from "react";
import "./HorasPage.css";

const STORAGE_KEY_HORAS = "isp_horas_v1";

const PROJECTS = [
  { id: "cap",  name: "Capacitación y adiestramiento", color: "#1BA8A0" },
  { id: "cal",  name: "Calibración",                   color: "#1E5C8A" },
  { id: "kpi",  name: "KPI's",                         color: "#5B3FA8" },
  { id: "ind",  name: "Inducción",                     color: "#1A3A5C" },
  { id: "rap",  name: "RAP Genética",                  color: "#2E7D6A" },
  { id: "cya",  name: "CyA Genética",                  color: "#7A5800" },
  { id: "calg", name: "Cal. Genética",                 color: "#C0392B" },
];

const PHASES = [
  { key: "F1", name: "Diagnóstico",    color: "#1BA8A0", bg: "#E0F5F4", tx: "#0D6E6A" },
  { key: "F2", name: "Planificación",  color: "#1E5C8A", bg: "#D6E8F5", tx: "#1A3A5C" },
  { key: "F3", name: "Implementación", color: "#5B3FA8", bg: "#EAE5F8", tx: "#3C3489" },
  { key: "F4", name: "Entrega",        color: "#1A3A5C", bg: "#D4E0EC", tx: "#0F2236" },
];

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function loadHoras() {
  try { const s = localStorage.getItem(STORAGE_KEY_HORAS); if (s) return JSON.parse(s); } catch {}
  return [];
}
function saveHoras(data) {
  try { localStorage.setItem(STORAGE_KEY_HORAS, JSON.stringify(data)); } catch {}
}

function fmtHrs(h) { return h % 1 === 0 ? String(h) : h.toFixed(1); }
function fmtDate(d) {
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(m)-1]} ${y}`;
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export default function HorasPage({ onBack }) {
  const [entries, setEntries] = useState(() => loadHoras());
  const [curYear,  setCurYear]  = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(new Date().getMonth());
  const [selDate,  setSelDate]  = useState(todayStr());

  const [inpDate,  setInpDate]  = useState(todayStr());
  const [inpHrs,   setInpHrs]   = useState("");
  const [inpNote,  setInpNote]  = useState("");
  const [inpProj,  setInpProj]  = useState(PROJECTS[0].id);
  const [inpPhase, setInpPhase] = useState("F1");

  useEffect(() => { saveHoras(entries); }, [entries]);

  function changeMonth(d) {
    let m = curMonth + d, y = curYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCurMonth(m); setCurYear(y);
  }

  function addEntry() {
    const h = parseFloat(inpHrs);
    if (!inpDate || !h || h <= 0) return;
    setEntries(prev => [...prev, { date: inpDate, hrs: h, projId: inpProj, phase: inpPhase, note: inpNote.trim() }]);
    setInpHrs(""); setInpNote("");
    const [y, m] = inpDate.split("-").map(Number);
    setCurYear(y); setCurMonth(m - 1);
  }

  function deleteEntry(idx) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  function selectDay(dateStr) {
    setSelDate(dateStr);
    setInpDate(dateStr);
    const [y, m] = dateStr.split("-").map(Number);
    setCurYear(y); setCurMonth(m - 1);
  }

  const monthEntries = entries.filter(e => {
    const [y, m] = e.date.split("-").map(Number);
    return y === curYear && m - 1 === curMonth;
  });

  const totalHrs    = monthEntries.reduce((s, e) => s + e.hrs, 0);
  const daysWithData = new Set(monthEntries.map(e => e.date)).size;

  const todayWeekKey = getWeekKey(todayStr());
  const weekHrs = entries.filter(e => getWeekKey(e.date) === todayWeekKey).reduce((s, e) => s + e.hrs, 0);
  const activeProjs = new Set(monthEntries.map(e => e.projId)).size;

  const byDate = {};
  const byDateProj = {};
  monthEntries.forEach(e => {
    byDate[e.date] = (byDate[e.date] || 0) + e.hrs;
    byDateProj[e.date] = byDateProj[e.date] || [];
    if (!byDateProj[e.date].includes(e.projId)) byDateProj[e.date].push(e.projId);
  });

  const firstDay    = new Date(curYear, curMonth, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const today       = todayStr();

  const byProj = {};
  monthEntries.forEach(e => { byProj[e.projId] = (byProj[e.projId] || 0) + e.hrs; });
  const projTotal = Object.values(byProj).reduce((s, v) => s + v, 0) || 1;

  const byPhase = { F1: 0, F2: 0, F3: 0, F4: 0 };
  monthEntries.forEach(e => { byPhase[e.phase] = (byPhase[e.phase] || 0) + e.hrs; });
  const phaseTotal = Object.values(byPhase).reduce((s, v) => s + v, 0) || 1;

  const weeks = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${curYear}-${String(curMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const weekN = Math.ceil((d + offset) / 7);
    if (!weeks[weekN - 1]) weeks[weekN - 1] = { label: `S${weekN}`, start: d, end: d, hrs: 0 };
    weeks[weekN - 1].hrs += (byDate[dateStr] || 0);
    weeks[weekN - 1].end = d;
  }
  const maxWeekHrs = Math.max(...weeks.map(w => w.hrs), 1);

  const sortedLog = [...entries]
    .map((e, i) => ({ ...e, _idx: i }))
    .filter(e => { const [y, m] = e.date.split("-").map(Number); return y === curYear && m - 1 === curMonth; })
    .sort((a, b) => b.date.localeCompare(a.date));

  function projColor(id) { return PROJECTS.find(p => p.id === id)?.color || "#888"; }
  function projName(id)  { return PROJECTS.find(p => p.id === id)?.name  || id; }
  function phaseInfo(k)  { return PHASES.find(p => p.key === k) || PHASES[0]; }

  return (
    <div className="hp-page">

      {/* TOP BAR */}
      <div className="hp-topbar">
        <div className="hp-brand">
          <img src="/isp.jpg" alt="ISP" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          <div className="hp-titles">
            <div className="hp-title">Registro de horas</div>
            <div className="hp-sub">ISP · Infraestructura y Servicios Portuarios</div>
          </div>
        </div>

        <div className="hp-nav">
          <button className="hp-nav-btn" onClick={onBack}>← Plan maestro</button>
          <div className="hp-month-nav">
            <button className="hp-month-btn" onClick={() => changeMonth(-1)}>‹</button>
            <div className="hp-month-label">{MONTHS_ES[curMonth]} {curYear}</div>
            <button className="hp-month-btn" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="hp-kpis">
        <div className="hp-kpi hp-kpi--teal">
          <div className="hp-kpi__val">{fmtHrs(totalHrs)}</div>
          <div className="hp-kpi__lbl">Horas este mes</div>
          <div className="hp-kpi__sub">{daysWithData} días con registro</div>
        </div>
        <div className="hp-kpi hp-kpi--navy">
          <div className="hp-kpi__val">{fmtHrs(weekHrs)}</div>
          <div className="hp-kpi__lbl">Esta semana</div>
          <div className="hp-kpi__sub">semana actual</div>
        </div>
        <div className="hp-kpi">
          <div className="hp-kpi__val">{daysWithData > 0 ? (totalHrs / daysWithData).toFixed(1) : "0"}</div>
          <div className="hp-kpi__lbl">Promedio diario</div>
          <div className="hp-kpi__sub">{daysWithData} días activos</div>
        </div>
        <div className="hp-kpi">
          <div className="hp-kpi__val">{activeProjs}</div>
          <div className="hp-kpi__lbl">Proyectos activos</div>
          <div className="hp-kpi__sub">de {PROJECTS.length} proyectos</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="hp-main">

        {/* CALENDAR */}
        <div className="hp-card">
          <div className="hp-card__head">
            <div className="hp-card__title">Calendario — {MONTHS_ES[curMonth]} {curYear}</div>
            <div className="hp-card__hint">Clic en un día para registrar</div>
          </div>
          <div className="hp-card__body">
            <div className="hp-day-names">
              {DAY_NAMES.map(d => <div key={d} className="hp-dn">{d}</div>)}
            </div>
            <div className="hp-cal-grid">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`e${i}`} className="hp-day hp-day--empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d    = i + 1;
                const ds   = `${curYear}-${String(curMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const hrs  = byDate[ds] || 0;
                const projs= byDateProj[ds] || [];
                const cls  = [
                  "hp-day",
                  hrs > 0      ? "hp-day--has"      : "",
                  ds === today ? "hp-day--today"     : "",
                  ds === selDate ? "hp-day--selected" : "",
                ].join(" ");
                return (
                  <div key={ds} className={cls} onClick={() => selectDay(ds)}>
                    <div className="hp-day__num">{d}</div>
                    {hrs > 0 && <div className="hp-day__total">{fmtHrs(hrs)}h</div>}
                    {projs.length > 0 && (
                      <div className="hp-day__dots">
                        {projs.map(pid => (
                          <div key={pid} className="hp-dot" style={{ backgroundColor: projColor(pid) }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Week bars */}
            <div className="hp-week-section">
              <div className="hp-week-lbl">Horas por semana</div>
              {weeks.map((w, i) => (
                <div key={i} className="hp-week-row">
                  <div className="hp-week-tag">{w.label} <span style={{ fontSize: 10, color: "#7A95AE" }}>{w.start}–{w.end}</span></div>
                  <div className="hp-week-track">
                    <div className="hp-week-fill" style={{ width: `${Math.round((w.hrs / maxWeekHrs) * 100)}%` }} />
                  </div>
                  <div className="hp-week-val">{fmtHrs(w.hrs)}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Por proyecto */}
          <div className="hp-card">
            <div className="hp-card__head"><div className="hp-card__title">Horas por proyecto</div></div>
            <div className="hp-card__body">
              {Object.keys(byProj).length === 0
                ? <div className="hp-empty">Sin datos este mes</div>
                : (
                  <div className="hp-bar-list">
                    {Object.entries(byProj).sort((a,b)=>b[1]-a[1]).map(([id, h]) => (
                      <div key={id} className="hp-bar-item">
                        <div className="hp-bar-top">
                          <div className="hp-bar-name">{projName(id)}</div>
                          <div className="hp-bar-hrs">{fmtHrs(h)} hrs</div>
                        </div>
                        <div className="hp-bar-track">
                          <div className="hp-bar-fill" style={{ width: `${Math.round((h/projTotal)*100)}%`, backgroundColor: projColor(id) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Por fase */}
          <div className="hp-card">
            <div className="hp-card__head"><div className="hp-card__title">Horas por fase</div></div>
            <div className="hp-card__body">
              <div className="hp-bar-list">
                {PHASES.map(ph => (
                  <div key={ph.key} className="hp-bar-item">
                    <div className="hp-bar-top">
                      <div className="hp-bar-name" style={{ color: ph.color }}>{ph.key} · {ph.name}</div>
                      <div className="hp-bar-hrs">{fmtHrs(byPhase[ph.key])} hrs</div>
                    </div>
                    <div className="hp-bar-track">
                      <div className="hp-bar-fill" style={{ width: `${Math.round((byPhase[ph.key]/phaseTotal)*100)}%`, backgroundColor: ph.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD FORM */}
      <div className="hp-add">
        <div className="hp-add__title">Registrar horas</div>
        <div className="hp-add__form">
          <div className="hp-field">
            <label>Fecha</label>
            <input type="date" value={inpDate} onChange={e => { setInpDate(e.target.value); setSelDate(e.target.value); }} />
          </div>
          <div className="hp-field">
            <label>Horas</label>
            <input type="number" value={inpHrs} onChange={e => setInpHrs(e.target.value)}
              min="0.5" max="12" step="0.5" placeholder="Ej. 3" />
          </div>
          <div className="hp-field">
            <label>Nota / actividad</label>
            <input type="text" value={inpNote} onChange={e => setInpNote(e.target.value)}
              placeholder="Ej. Revisión de materiales con equipo" />
          </div>
          <div className="hp-field">
            <label>Proyecto</label>
            <select value={inpProj} onChange={e => setInpProj(e.target.value)}>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="hp-field">
            <label>Fase</label>
            <select value={inpPhase} onChange={e => setInpPhase(e.target.value)}>
              {PHASES.map(p => <option key={p.key} value={p.key}>{p.key} · {p.name}</option>)}
            </select>
          </div>
          <button className="hp-add-btn" onClick={addEntry}>+ Agregar</button>
        </div>
      </div>

      {/* LOG TABLE */}
      <div className="hp-log">
        <div className="hp-log__head">
          <div className="hp-card__title">Registro — {MONTHS_ES[curMonth]} {curYear}</div>
          <div style={{ fontSize: 11, color: "#7A95AE" }}>{sortedLog.length} registros · {fmtHrs(totalHrs)} hrs en total</div>
        </div>
        <div className="hp-log__cols">
          <div>Fecha</div><div>Proyecto</div><div>Nota</div><div>Fase</div><div>Horas</div><div></div>
        </div>
        {sortedLog.length === 0
          ? <div className="hp-log__empty">Sin registros este mes — agrega tu primera sesión arriba</div>
          : sortedLog.map(e => {
              const ph = phaseInfo(e.phase);
              return (
                <div key={e._idx} className="hp-log__row">
                  <div style={{ color: "#7A95AE" }}>{fmtDate(e.date)}</div>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, backgroundColor: projColor(e.projId), marginRight: 6 }} />
                    {projName(e.projId)}
                  </div>
                  <div style={{ color: "#7A95AE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note || "—"}</div>
                  <div>
                    <span className="hp-ph-pill" style={{ backgroundColor: ph.bg, color: ph.tx }}>{ph.key}</span>
                  </div>
                  <div className="hp-hrs-val">{fmtHrs(e.hrs)} h</div>
                  <button className="hp-del" onClick={() => deleteEntry(e._idx)}>×</button>
                </div>
              );
            })
        }
      </div>

    </div>
  );
}