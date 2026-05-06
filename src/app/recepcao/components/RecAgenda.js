"use client";

import { useState } from "react";
import AbaAgenda from "../../dashboard/components/AbaAgenda";

export default function RecAgenda({ barbeiros }) {
  const [selecionado, setSelecionado] = useState(barbeiros[0] || null);

  return (
    <>
      <style>{`
        .rec-prof-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .rec-prof-btn {
          padding: 10px 24px;
          border: 1px solid rgba(26,18,9,0.2);
          background: none;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.6);
          cursor: pointer;
          transition: all 0.15s;
        }
        .rec-prof-btn:hover { border-color: rgba(26,18,9,0.4); color: #1a1209; }
        .rec-prof-btn.ativo { background: #1a1209; border-color: #1a1209; color: #f5ede3; }
      `}</style>

      <h1 className="page-title">Agenda</h1>
      <p className="page-subtitle">Selecione o profissional</p>
      <div className="divider" />

      <div className="rec-prof-selector">
        {barbeiros.map((b) => (
          <button
            key={b.id}
            className={`rec-prof-btn ${selecionado?.id === b.id ? "ativo" : ""}`}
            onClick={() => setSelecionado(b)}
          >
            {b.nome}
          </button>
        ))}
      </div>

      {selecionado && <AbaAgenda key={selecionado.id} barbeiro={selecionado} />}
    </>
  );
}
