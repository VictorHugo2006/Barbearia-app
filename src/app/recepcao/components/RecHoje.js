"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecHoje({ barbeiros }) {
  const [todos, setTodos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroProfissional, setFiltroProfissional] = useState("todos");
  const [filtroTurno, setFiltroTurno] = useState("todos");

  useEffect(() => {
    async function carregar() {
      const hoje = new Date();
      const dataStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;

      const { data } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lte("data_hora", `${dataStr}T23:59:59`)
        .order("data_hora", { ascending: true });

      setTodos(data || []);
      setCarregando(false);
    }
    carregar();
  }, []);

  // Filtros
  const filtrados = todos.filter((ag) => {
    const hora = parseInt(ag.data_hora.slice(11, 13));
    const profOk = filtroProfissional === "todos" || ag.barbeiro === filtroProfissional;
    const turnoOk =
      filtroTurno === "todos" ||
      (filtroTurno === "manha" && hora < 12) ||
      (filtroTurno === "tarde" && hora >= 12);
    return profOk && turnoOk;
  });

  const totalPorBarbeiro = barbeiros.reduce((acc, b) => {
    acc[b.nome] = todos.filter((ag) => ag.barbeiro === b.nome).length;
    return acc;
  }, {});

  return (
    <>
      <style>{`
        .rec-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .rec-stat {
          border: 1px solid rgba(26,18,9,0.15);
          background: rgba(255,255,255,0.5);
          padding: 14px 20px;
          min-width: 120px;
        }
        .rec-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #1a1209;
          line-height: 1;
          margin-bottom: 4px;
        }
        .rec-stat-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.45);
        }
        .rec-filtros {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }
        .rec-filtro-grupo {
          display: flex;
          gap: 0;
          border: 1px solid rgba(26,18,9,0.2);
          overflow: hidden;
        }
        .rec-filtro-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.45);
          align-self: center;
          margin-right: 8px;
        }
        .rec-filtro-btn {
          padding: 7px 16px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          letter-spacing: 1px;
          border: none;
          border-right: 1px solid rgba(26,18,9,0.15);
          background: none;
          color: rgba(26,18,9,0.5);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .rec-filtro-btn:last-child { border-right: none; }
        .rec-filtro-btn:hover { background: rgba(26,18,9,0.05); color: #1a1209; }
        .rec-filtro-btn.ativo { background: #1a1209; color: #f5ede3; }
        .rec-ag-barbeiro {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.4);
          margin-bottom: 2px;
        }
      `}</style>

      <h1 className="page-title">Hoje</h1>
      <p className="page-subtitle">
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <div className="divider" />

      {/* Estatísticas */}
      <div className="rec-stats">
        <div className="rec-stat">
          <div className="rec-stat-num">{todos.length}</div>
          <div className="rec-stat-label">Total</div>
        </div>
        {barbeiros.map((b) => (
          <div key={b.nome} className="rec-stat">
            <div className="rec-stat-num">{totalPorBarbeiro[b.nome] || 0}</div>
            <div className="rec-stat-label">{b.nome}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rec-filtros">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="rec-filtro-label">Profissional</span>
          <div className="rec-filtro-grupo">
            <button
              className={`rec-filtro-btn ${filtroProfissional === "todos" ? "ativo" : ""}`}
              onClick={() => setFiltroProfissional("todos")}
            >Todos</button>
            {barbeiros.map((b) => (
              <button
                key={b.nome}
                className={`rec-filtro-btn ${filtroProfissional === b.nome ? "ativo" : ""}`}
                onClick={() => setFiltroProfissional(b.nome)}
              >{b.nome}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="rec-filtro-label">Turno</span>
          <div className="rec-filtro-grupo">
            <button className={`rec-filtro-btn ${filtroTurno === "todos" ? "ativo" : ""}`} onClick={() => setFiltroTurno("todos")}>Todos</button>
            <button className={`rec-filtro-btn ${filtroTurno === "manha" ? "ativo" : ""}`} onClick={() => setFiltroTurno("manha")}>Manhã</button>
            <button className={`rec-filtro-btn ${filtroTurno === "tarde" ? "ativo" : ""}`} onClick={() => setFiltroTurno("tarde")}>Tarde</button>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="empty-state">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">Nenhum agendamento encontrado</div>
      ) : (
        filtrados.map((ag) => (
          <div key={ag.id} className="card-agendamento">
            <div className="hora">{ag.data_hora.slice(11, 16)}</div>
            <div className="ag-info">
              <div className="rec-ag-barbeiro">{ag.barbeiro}</div>
              <div className="ag-nome">{ag.nome_cliente}</div>
              <div className="ag-servico">{ag.servico}</div>
            </div>
            <div className={`ag-status status-${ag.status}`}>{ag.status}</div>
          </div>
        ))
      )}
    </>
  );
}
