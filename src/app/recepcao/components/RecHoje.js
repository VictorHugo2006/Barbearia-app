"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecHoje({ barbeiros }) {
  const [agPorBarbeiro, setAgPorBarbeiro] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [barbeiroAtivo, setBarbeiroAtivo] = useState(barbeiros[0]?.nome || "");

  useEffect(() => {
    async function carregar() {
      const agora = new Date();
      const trintaMinAtras = new Date(agora.getTime() - 30 * 60 * 1000);

      function toLocalStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:00`;
      }

      const inicio = toLocalStr(trintaMinAtras);
      const fim = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,"0")}-${String(agora.getDate()).padStart(2,"0")}T23:59:59`;

      const { data } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_hora", inicio)
        .lte("data_hora", fim)
        .order("data_hora", { ascending: true });

      const mapa = {};
      barbeiros.forEach((b) => { mapa[b.nome] = []; });
      (data || []).forEach((ag) => {
        if (mapa[ag.barbeiro] !== undefined) mapa[ag.barbeiro].push(ag);
      });

      setAgPorBarbeiro(mapa);
      setCarregando(false);
    }
    carregar();
  }, []);

  const total = Object.values(agPorBarbeiro).flat().length;

  return (
    <>
      <style>{`
        .rec-hoje-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .rec-stat {
          border: 1px solid rgba(26,18,9,0.15);
          background: rgba(255,255,255,0.5);
          padding: 16px 24px;
          min-width: 140px;
        }
        .rec-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
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
        .rec-barbeiro-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-bottom: 2px solid rgba(26,18,9,0.1);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .rec-barbeiro-tabs::-webkit-scrollbar { display: none; }
        .rec-barbeiro-tab {
          padding: 10px 24px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.45);
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          background: none;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .rec-barbeiro-tab.ativo {
          color: #1a1209;
          border-bottom-color: #1a1209;
          font-weight: 600;
        }
        .rec-barbeiro-tab .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #1a1209;
          color: #f5ede3;
          font-size: 10px;
          border-radius: 50%;
          margin-left: 6px;
        }
      `}</style>

      <h1 className="page-title">Hoje</h1>
      <p className="page-subtitle">
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <div className="divider" />

      {/* Estatísticas */}
      <div className="rec-hoje-stats">
        <div className="rec-stat">
          <div className="rec-stat-num">{total}</div>
          <div className="rec-stat-label">Agendamentos</div>
        </div>
        {barbeiros.map((b) => (
          <div key={b.nome} className="rec-stat">
            <div className="rec-stat-num">{(agPorBarbeiro[b.nome] || []).length}</div>
            <div className="rec-stat-label">{b.nome}</div>
          </div>
        ))}
      </div>

      {/* Tabs por barbeiro */}
      <div className="rec-barbeiro-tabs">
        {barbeiros.map((b) => (
          <button
            key={b.nome}
            className={`rec-barbeiro-tab ${barbeiroAtivo === b.nome ? "ativo" : ""}`}
            onClick={() => setBarbeiroAtivo(b.nome)}
          >
            {b.nome}
            {(agPorBarbeiro[b.nome] || []).length > 0 && (
              <span className="badge">{(agPorBarbeiro[b.nome] || []).length}</span>
            )}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="empty-state">Carregando...</div>
      ) : (agPorBarbeiro[barbeiroAtivo] || []).length === 0 ? (
        <div className="empty-state">Nenhum agendamento para hoje</div>
      ) : (
        (agPorBarbeiro[barbeiroAtivo] || []).map((ag) => (
          <div key={ag.id} className="card-agendamento">
            <div className="hora">{ag.data_hora.slice(11, 16)}</div>
            <div className="ag-info">
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
