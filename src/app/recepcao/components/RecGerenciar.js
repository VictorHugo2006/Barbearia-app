"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const STATUS = ["agendado", "confirmado", "cancelado"];

export default function RecGerenciar({ barbeiros }) {
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [editando, setEditando] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [novaDataHora, setNovaDataHora] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const debounceRef = useRef(null);

  // Autocomplete: busca nomes únicos ao digitar
  useEffect(() => {
    if (busca.trim().length < 2) { setSugestoes([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const agora = new Date().toISOString();
      const { data } = await supabase
        .from("agendamentos")
        .select("nome_cliente")
        .ilike("nome_cliente", `%${busca.trim()}%`)
        .gte("data_hora", agora)
        .order("nome_cliente")
        .limit(8);

      // Remove duplicatas
      const unicos = [...new Set((data || []).map((d) => d.nome_cliente))];
      setSugestoes(unicos);
    }, 300);
  }, [busca]);

  async function buscar(nome) {
    const termo = nome || busca;
    if (!termo.trim()) return;
    setBusca(termo);
    setSugestoes([]);
    setCarregando(true);
    setBuscou(true);
    setEditando(null);

    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .ilike("nome_cliente", `%${termo.trim()}%`)
      .order("data_hora", { ascending: true })
      .limit(30);

    setResultados(data || []);
    setCarregando(false);
  }

  async function salvarEdicao(ag) {
    setSalvando(true);
    const updates = {};
    if (novoStatus) updates.status = novoStatus;
    if (novaDataHora) updates.data_hora = novaDataHora.replace("T", "T") + ":00";

    const { error } = await supabase
      .from("agendamentos")
      .update(updates)
      .eq("id", ag.id);

    if (error) {
      setFeedback({ tipo: "erro", msg: "Erro ao salvar: " + error.message });
    } else {
      setResultados((prev) =>
        prev.map((r) => r.id === ag.id ? { ...r, ...updates } : r)
      );
      setFeedback({ tipo: "ok", msg: "Atualizado com sucesso!" });
      setEditando(null);
    }
    setSalvando(false);
    setTimeout(() => setFeedback(null), 3000);
  }

  function iniciarEdicao(ag) {
    setEditando(ag.id);
    setNovoStatus(ag.status);
    setNovaDataHora(ag.data_hora.slice(0, 16));
  }

  function formatarDataHora(str) {
    const [datePart, timePart] = str.split("T");
    const [y, m, d] = datePart.split("-");
    return `${d}/${m}/${y} às ${timePart.slice(0, 5)}`;
  }

  const isPast = (str) => new Date(str) < new Date();

  return (
    <>
      <style>{`
        .ger-busca-wrap {
          position: relative;
          max-width: 520px;
          margin-bottom: 28px;
        }
        .ger-busca {
          display: flex;
          gap: 0;
        }
        .ger-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(26,18,9,0.25);
          border-right: none;
          background: rgba(255,255,255,0.7);
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          color: #1a1209;
          outline: none;
          transition: border-color 0.2s;
        }
        .ger-input:focus { border-color: #1a1209; }
        .ger-input::placeholder { color: rgba(26,18,9,0.3); }
        .ger-btn-buscar {
          padding: 12px 24px;
          background: #1a1209;
          border: none;
          color: #f5ede3;
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .ger-btn-buscar:hover { background: #2e2010; }
        .ger-sugestoes {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid rgba(26,18,9,0.2);
          border-top: none;
          z-index: 50;
          max-height: 220px;
          overflow-y: auto;
        }
        .ger-sugestao {
          padding: 11px 16px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          color: #1a1209;
          cursor: pointer;
          border-bottom: 1px solid rgba(26,18,9,0.07);
          transition: background 0.1s;
        }
        .ger-sugestao:last-child { border-bottom: none; }
        .ger-sugestao:hover { background: rgba(26,18,9,0.05); }
        .ger-card {
          border: 1px solid rgba(26,18,9,0.15);
          background: rgba(255,255,255,0.5);
          margin-bottom: 10px;
          max-width: 680px;
        }
        .ger-card.passado { opacity: 0.6; }
        .ger-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }
        .ger-card-hora {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          color: #1a1209;
          min-width: 120px;
          line-height: 1.3;
        }
        .ger-card-info { flex: 1; }
        .ger-card-nome { font-size: 17px; color: #1a1209; margin-bottom: 2px; }
        .ger-card-detalhe {
          font-size: 12px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.5);
          text-transform: uppercase;
        }
        .ger-btn-editar {
          background: none;
          border: 1px solid rgba(26,18,9,0.25);
          color: #1a1209;
          padding: 6px 14px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ger-btn-editar:hover { background: rgba(26,18,9,0.06); }
        .ger-edicao {
          border-top: 1px solid rgba(26,18,9,0.1);
          padding: 16px 20px;
          background: rgba(245,237,227,0.5);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ger-edicao-linha {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ger-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.5);
          min-width: 60px;
        }
        .ger-select {
          padding: 8px 12px;
          border: 1px solid rgba(26,18,9,0.25);
          background: rgba(255,255,255,0.8);
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          color: #1a1209;
          outline: none;
          cursor: pointer;
        }
        .ger-datetime {
          padding: 8px 12px;
          border: 1px solid rgba(26,18,9,0.25);
          background: rgba(255,255,255,0.8);
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          color: #1a1209;
          outline: none;
        }
        .ger-edicao-btns { display: flex; gap: 10px; }
        .ger-btn-salvar {
          background: #1a1209;
          border: none;
          color: #f5ede3;
          padding: 8px 20px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ger-btn-salvar:disabled { opacity: 0.4; cursor: not-allowed; }
        .ger-btn-cancelar-ed {
          background: none;
          border: 1px solid rgba(26,18,9,0.2);
          color: rgba(26,18,9,0.5);
          padding: 8px 16px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          letter-spacing: 1px;
          cursor: pointer;
        }
        .ger-feedback {
          padding: 10px 14px;
          font-size: 12px;
          letter-spacing: 1px;
          border: 1px solid;
          margin-bottom: 16px;
          max-width: 680px;
        }
        .ger-feedback.ok { border-color: rgba(26,18,9,0.3); color: #1a1209; background: rgba(26,18,9,0.04); }
        .ger-feedback.erro { border-color: rgba(192,57,43,0.5); color: #c0392b; background: rgba(192,57,43,0.05); }
      `}</style>

      <h1 className="page-title">Gerenciar</h1>
      <p className="page-subtitle">Buscar, remarcar e cancelar agendamentos</p>
      <div className="divider" />

      <div className="ger-busca-wrap">
        <div className="ger-busca">
          <input
            className="ger-input"
            type="text"
            placeholder="Nome do cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
            autoComplete="off"
          />
          <button className="ger-btn-buscar" onClick={() => buscar()}>Buscar</button>
        </div>

        {sugestoes.length > 0 && (
          <div className="ger-sugestoes">
            {sugestoes.map((nome) => (
              <div key={nome} className="ger-sugestao" onClick={() => buscar(nome)}>
                {nome}
              </div>
            ))}
          </div>
        )}
      </div>

      {feedback && (
        <div className={`ger-feedback ${feedback.tipo}`}>{feedback.msg}</div>
      )}

      {carregando && <div className="empty-state">Buscando...</div>}

      {!carregando && buscou && resultados.length === 0 && (
        <div className="empty-state">Nenhum agendamento encontrado</div>
      )}

      {resultados.map((ag) => (
        <div key={ag.id} className={`ger-card ${isPast(ag.data_hora) ? "passado" : ""}`}>
          <div className="ger-card-header">
            <div className="ger-card-hora">{formatarDataHora(ag.data_hora)}</div>
            <div className="ger-card-info">
              <div className="ger-card-nome">{ag.nome_cliente}</div>
              <div className="ger-card-detalhe">
                {ag.servico} · {ag.barbeiro} ·{" "}
                <span style={{
                  color: ag.status === "cancelado" ? "#c0392b" : ag.status === "confirmado" ? "#2e7d32" : "#7a5920"
                }}>{ag.status}</span>
              </div>
            </div>
            {editando !== ag.id && (
              <button className="ger-btn-editar" onClick={() => iniciarEdicao(ag)}>Editar</button>
            )}
          </div>

          {editando === ag.id && (
            <div className="ger-edicao">
              <div className="ger-edicao-linha">
                <span className="ger-label">Status</span>
                <select className="ger-select" value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="ger-edicao-linha">
                <span className="ger-label">Data/Hora</span>
                <input type="datetime-local" className="ger-datetime"
                  value={novaDataHora} onChange={(e) => setNovaDataHora(e.target.value)} />
              </div>
              <div className="ger-edicao-btns">
                <button className="ger-btn-salvar" disabled={salvando} onClick={() => salvarEdicao(ag)}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
                <button className="ger-btn-cancelar-ed" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
