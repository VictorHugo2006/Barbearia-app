"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// ─── helpers ───────────────────────────────────────────────────────────────

function toLocalDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nomeDiaSemana(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function nomeDiaCurto(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── component ─────────────────────────────────────────────────────────────

export default function AbaFinanceiro({ barbeiro }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("mes"); // "semana" | "mes"

  // Fetch dos últimos 60 dias (suficiente para mês + semana)
  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 60);

      const { data } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("barbeiro", barbeiro.nome)
        .gte("data_hora", toLocalDateStr(inicio) + "T00:00:00")
        .order("data_hora", { ascending: true });

      setAgendamentos(data || []);
      setCarregando(false);
    }
    buscar();
  }, [barbeiro.nome]);

  // ── Filtro de período ──────────────────────────────────────────────────
  const hoje = new Date();
  const inicioFiltro = useMemo(() => {
    const d = new Date();
    if (periodo === "semana") d.setDate(d.getDate() - 6);
    else d.setDate(1); // começo do mês
    return d;
  }, [periodo]);

  const agFiltrados = useMemo(() => {
    const inicioStr = toLocalDateStr(inicioFiltro) + "T00:00:00";
    const fimStr = toLocalDateStr(hoje) + "T23:59:59";
    return agendamentos.filter(
      (a) => a.data_hora >= inicioStr && a.data_hora <= fimStr
    );
  }, [agendamentos, inicioFiltro]);

  // ── Métricas principais ────────────────────────────────────────────────
  const total = agFiltrados.length;
  const confirmados = agFiltrados.filter(
    (a) => a.status === "confirmado" || a.status === "concluido" || a.status === "concluído"
  ).length;
  const cancelados = agFiltrados.filter((a) => a.status === "cancelado").length;
  const agendados = agFiltrados.filter((a) => a.status === "agendado").length;
  const taxaAproveitamento = total > 0 ? Math.round((confirmados / total) * 100) : 0;
  const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;

  // ── Gráfico — últimos 14 dias ──────────────────────────────────────────
  const diasGrafico = useMemo(() => {
    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = toLocalDateStr(d);
      const count = agendamentos.filter((a) => a.data_hora.startsWith(str)).length;
      dias.push({ str, count, diaSemana: nomeDiaSemana(str), dataCurta: nomeDiaCurto(str) });
    }
    return dias;
  }, [agendamentos]);

  const maxGrafico = Math.max(...diasGrafico.map((d) => d.count), 1);

  // ── Serviços mais solicitados ──────────────────────────────────────────
  const rankingServicos = useMemo(() => {
    const mapa = {};
    agFiltrados.forEach((a) => {
      if (!a.servico) return;
      mapa[a.servico] = (mapa[a.servico] || 0) + 1;
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [agFiltrados]);

  const maxServico = rankingServicos[0]?.[1] || 1;

  // ── Horários de pico ───────────────────────────────────────────────────
  const horariosPico = useMemo(() => {
    const mapa = {};
    agFiltrados.forEach((a) => {
      if (!a.data_hora) return;
      const h = a.data_hora.slice(11, 13) + "h";
      mapa[h] = (mapa[h] || 0) + 1;
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [agFiltrados]);

  // ── Label do período ───────────────────────────────────────────────────
  const labelPeriodo =
    periodo === "semana"
      ? "Últimos 7 dias"
      : new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  if (carregando)
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        Carregando dados...
      </div>
    );

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .fin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 8px;
        }

        .fin-periodo {
          display: flex;
          gap: 0;
          border: 1px solid rgba(26,18,9,0.2);
        }

        .fin-periodo-btn {
          padding: 7px 18px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          background: none;
          border: none;
          color: rgba(26,18,9,0.45);
          cursor: pointer;
          transition: all 0.15s;
        }

        .fin-periodo-btn.ativo {
          background: #1a1209;
          color: #f5ede3;
        }

        .fin-periodo-btn:not(.ativo):hover {
          background: rgba(26,18,9,0.06);
          color: #1a1209;
        }

        /* ── Cards de resumo ── */
        .fin-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        .fin-card {
          border: 1px solid rgba(26,18,9,0.12);
          background: rgba(255,255,255,0.55);
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fin-card-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.45);
        }

        .fin-card-value {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #1a1209;
          line-height: 1;
        }

        .fin-card-value.verde { color: #2e7d32; }
        .fin-card-value.vermelho { color: #c0392b; }
        .fin-card-value.dourado { color: #7a5920; }

        .fin-card-sub {
          font-size: 11px;
          color: rgba(26,18,9,0.4);
          letter-spacing: 1px;
        }

        /* ── Gráfico ── */
        .fin-section {
          margin-bottom: 32px;
        }

        .fin-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          color: #1a1209;
          margin-bottom: 4px;
        }

        .fin-section-sub {
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.4);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .fin-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(26,18,9,0.15), transparent);
          margin-bottom: 20px;
        }

        .grafico-wrap {
          border: 1px solid rgba(26,18,9,0.1);
          background: rgba(255,255,255,0.4);
          padding: 24px 20px 16px;
        }

        .grafico-barras {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 100px;
          margin-bottom: 8px;
        }

        .grafico-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          height: 100%;
          justify-content: flex-end;
        }

        .grafico-count {
          font-size: 10px;
          color: rgba(26,18,9,0.5);
          font-family: 'Cormorant Garamond', serif;
          min-height: 14px;
        }

        .grafico-barra {
          width: 100%;
          background: #1a1209;
          opacity: 0.75;
          border-radius: 1px 1px 0 0;
          min-height: 2px;
          transition: opacity 0.15s;
        }

        .grafico-col:hover .grafico-barra { opacity: 1; }

        .grafico-col.hoje .grafico-barra { background: #7a5920; opacity: 1; }

        .grafico-labels {
          display: flex;
          gap: 6px;
        }

        .grafico-label {
          flex: 1;
          text-align: center;
          font-size: 9px;
          color: rgba(26,18,9,0.4);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* ── Dois blocos lado a lado ── */
        .fin-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        /* ── Ranking de serviços ── */
        .ranking-item {
          margin-bottom: 14px;
        }

        .ranking-info {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 5px;
        }

        .ranking-nome {
          font-size: 15px;
          color: #1a1209;
        }

        .ranking-count {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          color: #7a5920;
        }

        .ranking-barra-bg {
          height: 3px;
          background: rgba(26,18,9,0.08);
          width: 100%;
        }

        .ranking-barra-fill {
          height: 100%;
          background: #1a1209;
          transition: width 0.4s ease;
        }

        /* ── Horários de pico ── */
        .pico-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(26,18,9,0.07);
          gap: 12px;
        }

        .pico-item:last-child { border-bottom: none; }

        .pico-hora {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1a1209;
          min-width: 42px;
        }

        .pico-barra-wrap {
          flex: 1;
          height: 4px;
          background: rgba(26,18,9,0.07);
        }

        .pico-barra {
          height: 100%;
          background: #7a5920;
        }

        .pico-count {
          font-size: 12px;
          color: rgba(26,18,9,0.5);
          letter-spacing: 1px;
          min-width: 28px;
          text-align: right;
        }

        /* ── Aviso sem dados ── */
        .fin-empty {
          text-align: center;
          padding: 40px 0;
          color: rgba(26,18,9,0.3);
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .fin-cards {
            grid-template-columns: repeat(2, 1fr);
          }

          .fin-grid-2 {
            grid-template-columns: 1fr;
          }

          .fin-card-value { font-size: 26px; }

          .grafico-barras { height: 72px; }

          .grafico-count { font-size: 9px; }
        }
      `}</style>

      {/* ── Cabeçalho + filtro ── */}
      <div className="fin-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">{labelPeriodo}</p>
        </div>
        <div className="fin-periodo">
          <button
            className={`fin-periodo-btn ${periodo === "mes" ? "ativo" : ""}`}
            onClick={() => setPeriodo("mes")}
          >
            Mês
          </button>
          <button
            className={`fin-periodo-btn ${periodo === "semana" ? "ativo" : ""}`}
            onClick={() => setPeriodo("semana")}
          >
            Semana
          </button>
        </div>
      </div>
      <div className="divider" />

      {/* ── Cards de resumo ── */}
      <div className="fin-cards">
        <div className="fin-card">
          <span className="fin-card-label">Total de atendimentos</span>
          <span className="fin-card-value">{total}</span>
          <span className="fin-card-sub">{labelPeriodo}</span>
        </div>

        <div className="fin-card">
          <span className="fin-card-label">Confirmados</span>
          <span className="fin-card-value verde">{confirmados}</span>
          <span className="fin-card-sub">{taxaAproveitamento}% do total</span>
        </div>

        <div className="fin-card">
          <span className="fin-card-label">Cancelados</span>
          <span className="fin-card-value vermelho">{cancelados}</span>
          <span className="fin-card-sub">{taxaCancelamento}% do total</span>
        </div>

        <div className="fin-card">
          <span className="fin-card-label">Aguardando</span>
          <span className="fin-card-value dourado">{agendados}</span>
          <span className="fin-card-sub">status agendado</span>
        </div>
      </div>

      {/* ── Gráfico — últimos 14 dias ── */}
      <div className="fin-section">
        <div className="fin-section-title">Atendimentos por dia</div>
        <div className="fin-section-sub">Últimos 14 dias</div>
        <div className="fin-divider" />

        <div className="grafico-wrap">
          <div className="grafico-barras">
            {diasGrafico.map((d) => {
              const isHoje = d.str === toLocalDateStr(hoje);
              const pct = maxGrafico > 0 ? (d.count / maxGrafico) * 100 : 0;
              return (
                <div
                  key={d.str}
                  className={`grafico-col${isHoje ? " hoje" : ""}`}
                  title={`${d.dataCurta}: ${d.count} atendimento${d.count !== 1 ? "s" : ""}`}
                >
                  <span className="grafico-count">
                    {d.count > 0 ? d.count : ""}
                  </span>
                  <div
                    className="grafico-barra"
                    style={{ height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="grafico-labels">
            {diasGrafico.map((d) => (
              <span key={d.str} className="grafico-label">
                {d.diaSemana}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Serviços + Horários ── */}
      <div className="fin-grid-2">

        {/* Serviços mais solicitados */}
        <div className="fin-section">
          <div className="fin-section-title">Serviços mais solicitados</div>
          <div className="fin-section-sub">{labelPeriodo}</div>
          <div className="fin-divider" />

          {rankingServicos.length === 0 ? (
            <div className="fin-empty">Sem dados</div>
          ) : (
            rankingServicos.map(([servico, count]) => (
              <div key={servico} className="ranking-item">
                <div className="ranking-info">
                  <span className="ranking-nome">{servico}</span>
                  <span className="ranking-count">{count}</span>
                </div>
                <div className="ranking-barra-bg">
                  <div
                    className="ranking-barra-fill"
                    style={{ width: `${(count / maxServico) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Horários de pico */}
        <div className="fin-section">
          <div className="fin-section-title">Horários de pico</div>
          <div className="fin-section-sub">{labelPeriodo}</div>
          <div className="fin-divider" />

          {horariosPico.length === 0 ? (
            <div className="fin-empty">Sem dados</div>
          ) : (
            horariosPico.map(([hora, count]) => {
              const maxPico = horariosPico[0][1];
              return (
                <div key={hora} className="pico-item">
                  <span className="pico-hora">{hora}</span>
                  <div className="pico-barra-wrap">
                    <div
                      className="pico-barra"
                      style={{ width: `${(count / maxPico) * 100}%` }}
                    />
                  </div>
                  <span className="pico-count">
                    {count} ag{count !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}
