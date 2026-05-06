"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
];

export default function AbaBloqueios({ barbeiro }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [bloqueios, setBloqueios] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  function diasDoMes() {
    const dias = [];
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let i = 1; i <= totalDias; i++) dias.push(i);
    return dias;
  }

  async function selecionarDia(dia) {
    if (!dia) return;
    setDiaSelecionado(dia);

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const { data } = await supabase
      .from("bloqueios")
      .select("*")
      .eq("barbeiro_id", barbeiro.id)
      .gte("data_hora", `${dataStr}T00:00:00`)
      .lt("data_hora", `${dataStr}T23:59:59`);

    setBloqueios(data?.map((b) => b.data_hora.slice(11, 16)) || []);
  }

  function toggleHorario(horario) {
    if (bloqueios.includes(horario)) {
      setBloqueios(bloqueios.filter((h) => h !== horario));
    } else {
      setBloqueios([...bloqueios, horario]);
    }
  }

  async function salvar() {
    if (!diaSelecionado) return;
    setSalvando(true);

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaSelecionado).padStart(2, "0")}`;

    await supabase
      .from("bloqueios")
      .delete()
      .eq("barbeiro_id", barbeiro.id)
      .gte("data_hora", `${dataStr}T00:00:00`)
      .lt("data_hora", `${dataStr}T23:59:59`);

    if (bloqueios.length > 0) {
      const inserts = bloqueios.map((h) => ({
        barbeiro_id: barbeiro.id,
        data_hora: `${dataStr}T${h}:00`,
        motivo: "bloqueio manual",
      }));

      const { error: errInsert } = await supabase.from("bloqueios").insert(inserts);

      if (errInsert) {
        setFeedback({ tipo: "erro", msg: `Erro ao salvar: ${errInsert.message}` });
        setSalvando(false);
        return;
      }
    }

    setFeedback({ tipo: "ok", msg: "Bloqueios salvos com sucesso!" });
    setTimeout(() => setFeedback(null), 3000);
    setSalvando(false);
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else setMes(mes - 1);
    setDiaSelecionado(null);
    setBloqueios([]);
  }

  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else setMes(mes + 1);
    setDiaSelecionado(null);
    setBloqueios([]);
  }

  const ehHoje = (dia) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  return (
    <>
      <style>{`
        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .cal-mes {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          letter-spacing: 3px;
          color: #1a1209;
          text-transform: uppercase;
        }
        .cal-nav {
          background: none;
          border: 1px solid rgba(26,18,9,0.25);
          color: #1a1209;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .cal-nav:hover {
          background: rgba(26,18,9,0.06);
          border-color: #1a1209;
        }
        .cal-semana {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
        }
        .cal-semana span {
          text-align: center;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.4);
          text-transform: uppercase;
          padding: 4px 0;
        }
        .cal-dias {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .cal-dia {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid transparent;
          color: rgba(26,18,9,0.65);
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cal-dia:hover:not(.vazio) {
          border-color: rgba(26,18,9,0.2);
          color: #1a1209;
        }
        .cal-dia.vazio { cursor: default; pointer-events: none; }
        .cal-dia.hoje {
          border-color: rgba(26,18,9,0.35);
          color: #7a5920;
          font-weight: 600;
        }
        .cal-dia.selecionado {
          background: #1a1209;
          border-color: #1a1209;
          color: #f5ede3;
        }
        .ag-panel {
          border: 1px solid rgba(26,18,9,0.12);
          background: rgba(255,255,255,0.45);
          padding: 28px;
          min-height: 300px;
        }
        .ag-panel-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #1a1209;
          margin-bottom: 6px;
        }
        .ag-panel-sub {
          font-size: 12px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.4);
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .ag-panel-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(26,18,9,0.15), transparent);
          margin-bottom: 20px;
        }
        .bloqueios-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .horarios-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        .horario-btn {
          padding: 10px 4px;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          letter-spacing: 1px;
          border: 1px solid rgba(26,18,9,0.15);
          background: none;
          color: rgba(26,18,9,0.55);
          cursor: pointer;
          transition: all 0.15s;
        }
        .horario-btn:hover {
          border-color: rgba(26,18,9,0.35);
          color: #1a1209;
        }
        .horario-btn.bloqueado {
          background: rgba(192,57,43,0.1);
          border-color: rgba(192,57,43,0.5);
          color: #c0392b;
        }
        .btn-salvar {
          width: 100%;
          padding: 14px;
          background: #1a1209;
          border: none;
          cursor: pointer;
          font-family: 'Playfair Display', serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #f5ede3;
          transition: all 0.3s;
        }
        .btn-salvar:hover { background: #2e2010; }
        .btn-salvar:disabled { opacity: 0.5; cursor: not-allowed; }
        .legenda { display: flex; gap: 20px; margin-bottom: 20px; }
        .legenda-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.5);
        }
        .legenda-cor { width: 12px; height: 12px; border: 1px solid; flex-shrink: 0; }
        .legenda-livre { border-color: rgba(26,18,9,0.2); }
        .legenda-bloqueado { border-color: rgba(192,57,43,0.5); background: rgba(192,57,43,0.1); }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          .bloqueios-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cal-mes {
            font-size: 14px;
            letter-spacing: 2px;
          }
          .cal-dia {
            font-size: 13px;
          }
          .cal-semana span {
            font-size: 9px;
            letter-spacing: 0;
          }
          .ag-panel {
            padding: 20px 16px;
            min-height: unset;
          }
          .horarios-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
          }
          .horario-btn {
            padding: 12px 2px;
            font-size: 13px;
          }
        }
      `}</style>

      <h1 className="page-title">Bloqueios</h1>
      <p className="page-subtitle">Selecione um dia e bloqueie os horários indisponíveis</p>
      <div className="divider" />

      <div className="bloqueios-grid">
        <div>
          <div className="cal-header">
            <button className="cal-nav" onClick={mesAnterior}>‹</button>
            <span className="cal-mes">{meses[mes]} {ano}</span>
            <button className="cal-nav" onClick={proximoMes}>›</button>
          </div>

          <div className="cal-semana">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="cal-dias">
            {diasDoMes().map((dia, i) => (
              <button
                key={i}
                className={`cal-dia ${!dia ? "vazio" : ""} ${ehHoje(dia) ? "hoje" : ""} ${diaSelecionado === dia ? "selecionado" : ""}`}
                onClick={() => selecionarDia(dia)}
              >
                {dia || ""}
              </button>
            ))}
          </div>
        </div>

        <div className="ag-panel">
          {!diaSelecionado ? (
            <div className="empty-state">Selecione um dia para gerenciar os horários</div>
          ) : (
            <>
              <div className="ag-panel-title">{diaSelecionado} de {meses[mes]}</div>
              <div className="ag-panel-sub">Clique nos horários para bloquear ou desbloquear</div>
              <div className="ag-panel-divider" />

              <div className="legenda">
                <div className="legenda-item">
                  <div className="legenda-cor legenda-livre" />
                  Livre
                </div>
                <div className="legenda-item">
                  <div className="legenda-cor legenda-bloqueado" />
                  Bloqueado
                </div>
              </div>

              <div className="horarios-grid">
                {HORARIOS.map((h) => (
                  <button
                    key={h}
                    className={`horario-btn ${bloqueios.includes(h) ? "bloqueado" : ""}`}
                    onClick={() => toggleHorario(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {feedback && (
                <div style={{
                  padding: "10px 14px",
                  marginBottom: "12px",
                  fontSize: "12px",
                  letterSpacing: "1px",
                  border: "1px solid",
                  borderColor: feedback.tipo === "ok" ? "rgba(26,18,9,0.3)" : "rgba(192,57,43,0.5)",
                  color: feedback.tipo === "ok" ? "#1a1209" : "#c0392b",
                  background: feedback.tipo === "ok" ? "rgba(26,18,9,0.04)" : "rgba(192,57,43,0.05)",
                }}>
                  {feedback.msg}
                </div>
              )}

              <button className="btn-salvar" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Bloqueios"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
