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

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function AbaAgenda({ barbeiro }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [carregando, setCarregando] = useState(false);

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
    setCarregando(true);

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const [{ data: ags }, { data: blq }] = await Promise.all([
      supabase
        .from("agendamentos")
        .select("*")
        .eq("barbeiro", barbeiro.nome)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`)
        .order("data_hora", { ascending: true }),
      supabase
        .from("bloqueios")
        .select("data_hora")
        .eq("barbeiro_id", barbeiro.id)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`),
    ]);

    const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000);
    const filtrados = (ags || []).filter((ag) => {
      const [datePart, timePart] = ag.data_hora.split("T");
      const [y, mo, d] = datePart.split("-").map(Number);
      const [h, mi] = timePart.split(":").map(Number);
      return new Date(y, mo - 1, d, h, mi) > trintaMinAtras;
    });

    setAgendamentos(filtrados);
    setBloqueados((blq || []).map((b) => b.data_hora.slice(11, 16)));
    setCarregando(false);
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else setMes(mes - 1);
    setDiaSelecionado(null);
  }

  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else setMes(mes + 1);
    setDiaSelecionado(null);
  }

  const ehHoje = (dia) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  // Mapa de horário → agendamento
  const agPorHorario = {};
  agendamentos.forEach((ag) => {
    agPorHorario[ag.data_hora.slice(11, 16)] = ag;
  });

  function statusHorario(h) {
    if (bloqueados.includes(h)) return "bloqueado";
    if (agPorHorario[h]) return "agendado";
    return "livre";
  }

  return (
    <>
      <style>{`
        .agenda-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .cal-mes {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #1a1209;
          letter-spacing: 2px;
        }
        .cal-nav {
          background: none;
          border: 1px solid rgba(26,18,9,0.25);
          color: #1a1209;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .cal-nav:hover { background: rgba(26,18,9,0.06); }
        .cal-semana {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
        }
        .cal-semana span {
          text-align: center;
          font-size: 10px;
          letter-spacing: 2px;
          color: #1a1209;
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
          font-size: 14px;
          color: #1a1209;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          background: none;
          font-family: 'Cormorant Garamond', serif;
        }
        .cal-dia:hover { border-color: rgba(26,18,9,0.2); }
        .cal-dia.hoje {
          color: #7a5920;
          border-color: rgba(26,18,9,0.35);
          font-weight: 600;
        }
        .cal-dia.selecionado {
          background: #1a1209;
          border-color: #1a1209;
          color: #f5ede3;
        }
        .cal-dia.vazio { cursor: default; }
        .cal-dia.vazio:hover { border-color: transparent; }

        .ag-panel {
          border: 1px solid rgba(26,18,9,0.12);
          background: rgba(255,255,255,0.45);
          padding: 24px;
          min-height: 300px;
        }
        .ag-panel-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1a1209;
          margin-bottom: 4px;
        }
        .ag-panel-sub {
          font-size: 11px;
          letter-spacing: 2px;
          color: #1a1209;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .ag-panel-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(26,18,9,0.2), transparent);
          margin-bottom: 16px;
        }

        /* Legenda */
        .ag-legenda {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .ag-legenda-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.5);
        }
        .ag-legenda-cor {
          width: 10px;
          height: 10px;
          border: 1px solid;
          flex-shrink: 0;
        }
        .ag-legenda-livre  { border-color: rgba(26,18,9,0.2); }
        .ag-legenda-agendado { border-color: rgba(180,140,60,0.6); background: rgba(180,140,60,0.15); }
        .ag-legenda-bloqueado { border-color: rgba(192,57,43,0.5); background: rgba(192,57,43,0.1); }

        /* Grade de horários */
        .ag-horarios-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 20px;
        }
        .ag-horario {
          padding: 9px 4px;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          letter-spacing: 1px;
          border: 1px solid rgba(26,18,9,0.12);
          color: rgba(26,18,9,0.4);
          background: none;
          cursor: default;
        }
        .ag-horario.agendado {
          background: rgba(180,140,60,0.15);
          border-color: rgba(180,140,60,0.6);
          color: #7a5920;
          font-weight: 600;
        }
        .ag-horario.bloqueado {
          background: rgba(192,57,43,0.1);
          border-color: rgba(192,57,43,0.4);
          color: #c0392b;
        }

        /* Cards de agendamento */
        .ag-secao-titulo {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.4);
          margin-bottom: 10px;
        }

        @media (max-width: 600px) {
          .agenda-grid { grid-template-columns: 1fr; gap: 24px; }
          .cal-mes { font-size: 15px; letter-spacing: 1px; }
          .cal-semana span { font-size: 9px; letter-spacing: 0; }
          .cal-dia { font-size: 13px; }
          .ag-panel { padding: 20px 16px; min-height: unset; }
        }
      `}</style>

      <h1 className="page-title">Agenda</h1>
      <p className="page-subtitle">Selecione um dia para ver os agendamentos</p>
      <div className="divider" />

      <div className="agenda-grid">
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
            <div className="empty-state">Selecione um dia no calendário</div>
          ) : carregando ? (
            <div className="empty-state">Carregando...</div>
          ) : (
            <>
              <div className="ag-panel-title">{diaSelecionado} de {meses[mes]}</div>
              <div className="ag-panel-sub">
                {agendamentos.length} agendamento{agendamentos.length !== 1 ? "s" : ""}
                {bloqueados.length > 0 && ` · ${bloqueados.length} bloqueio${bloqueados.length !== 1 ? "s" : ""}`}
              </div>
              <div className="ag-panel-divider" />

              {/* Legenda */}
              <div className="ag-legenda">
                <div className="ag-legenda-item">
                  <div className="ag-legenda-cor ag-legenda-livre" /> Livre
                </div>
                <div className="ag-legenda-item">
                  <div className="ag-legenda-cor ag-legenda-agendado" /> Agendado
                </div>
                <div className="ag-legenda-item">
                  <div className="ag-legenda-cor ag-legenda-bloqueado" /> Bloqueado
                </div>
              </div>

              {/* Grade de horários colorida */}
              <div className="ag-horarios-grid">
                {HORARIOS.map((h) => (
                  <div key={h} className={`ag-horario ${statusHorario(h)}`}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Cards dos agendamentos */}
              {agendamentos.length > 0 && (
                <>
                  <div className="ag-secao-titulo">Detalhes</div>
                  {agendamentos.map((ag) => (
                    <div key={ag.id} className="card-agendamento">
                      <div className="hora">
                        {ag.data_hora.slice(11, 16)}
                      </div>
                      <div className="ag-info">
                        <div className="ag-nome">{ag.nome_cliente}</div>
                        <div className="ag-servico">{ag.servico}</div>
                      </div>
                      <div className={`ag-status status-${ag.status}`}>{ag.status}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
