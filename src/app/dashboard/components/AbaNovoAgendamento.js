"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const SERVICOS = ["Corte", "Barba", "Corte + Barba", "Depilação do nariz"];

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

export default function AbaNovoAgendamento({ barbeiro }) {
  const hoje = new Date();

  // Passo atual: 1=nome, 2=serviço, 3=data, 4=hora
  const [passo, setPasso] = useState(1);

  // Dados do formulário
  const [nomeCliente, setNomeCliente] = useState("");
  const [servico, setServico] = useState("");
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [horario, setHorario] = useState("");

  // Estado do passo 4
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  // Resultado final
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  // ── Calendário ──────────────────────────────────────────
  function diasDoMes() {
    const dias = [];
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let i = 1; i <= totalDias; i++) dias.push(i);
    return dias;
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

  const ehPassado = (dia) => {
    if (!dia) return false;
    const data = new Date(ano, mes, dia);
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return data < inicioHoje;
  };

  // ── Carregar horários ocupados/bloqueados para o dia ────
  async function carregarHorarios(dia) {
    setCarregandoHorarios(true);
    setHorario("");

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const [{ data: ags }, { data: blq }] = await Promise.all([
      supabase
        .from("agendamentos")
        .select("data_hora")
        .eq("barbeiro", barbeiro.nome)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`),
      supabase
        .from("bloqueios")
        .select("data_hora")
        .eq("barbeiro_id", barbeiro.id)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`),
    ]);

    const ocupados = [
      ...(ags || []).map((a) => a.data_hora.slice(11, 16)),
      ...(blq || []).map((b) => b.data_hora.slice(11, 16)),
    ];

    setHorariosOcupados(ocupados);
    setCarregandoHorarios(false);
  }

  // ── Salvar agendamento ───────────────────────────────────
  async function salvar() {
    if (!nomeCliente || !servico || !diaSelecionado || !horario) return;
    setSalvando(true);
    setErro(null);

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaSelecionado).padStart(2, "0")}`;

    const { error } = await supabase.from("agendamentos").insert({
      nome_cliente: nomeCliente.trim(),
      servico,
      data_hora: `${dataStr}T${horario}:00`,
      barbeiro: barbeiro.nome,
      status: "agendado",
    });

    if (error) {
      setErro(`Erro ao salvar: ${error.message}`);
      setSalvando(false);
      return;
    }

    setSucesso(true);
    setSalvando(false);
  }

  function resetar() {
    setPasso(1);
    setNomeCliente("");
    setServico("");
    setMes(hoje.getMonth());
    setAno(hoje.getFullYear());
    setDiaSelecionado(null);
    setHorario("");
    setHorariosOcupados([]);
    setSucesso(false);
    setErro(null);
  }

  const dataFormatada =
    diaSelecionado
      ? `${String(diaSelecionado).padStart(2, "0")} de ${meses[mes]} de ${ano}`
      : "";

  // ── Tela de sucesso ─────────────────────────────────────
  if (sucesso) {
    return (
      <>
        <style>{cssStr}</style>
        <h1 className="page-title">Novo Agendamento</h1>
        <p className="page-subtitle">Criar manualmente</p>
        <div className="divider" />

        <div className="na-sucesso">
          <div className="na-sucesso-icon">✓</div>
          <div className="na-sucesso-titulo">Agendamento criado!</div>
          <div className="na-sucesso-detalhe">
            <strong>{nomeCliente}</strong> — {servico}<br />
            {dataFormatada} às {horario}
          </div>
          <button className="na-btn-novo" onClick={resetar}>
            + Novo agendamento
          </button>
        </div>
      </>
    );
  }

  // ── Formulário por passos ───────────────────────────────
  return (
    <>
      <style>{cssStr}</style>

      <h1 className="page-title">Novo Agendamento</h1>
      <p className="page-subtitle">Criar manualmente</p>
      <div className="divider" />

      {/* Indicador de passos */}
      <div className="na-steps">
        {["Cliente", "Serviço", "Data", "Hora"].map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} className={`na-step ${passo === n ? "ativo" : ""} ${passo > n ? "feito" : ""}`}>
              <div className="na-step-num">{passo > n ? "✓" : n}</div>
              <div className="na-step-label">{label}</div>
              {n < 4 && <div className="na-step-line" />}
            </div>
          );
        })}
      </div>

      <div className="na-card">

        {/* ── Passo 1: Nome ── */}
        {passo === 1 && (
          <div className="na-passo">
            <div className="na-passo-titulo">Nome do cliente</div>
            <input
              className="na-input"
              type="text"
              placeholder="Digite o nome completo"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && nomeCliente.trim()) setPasso(2); }}
              autoFocus
            />
            <div className="na-rodape">
              <span />
              <button
                className="na-btn-avancar"
                disabled={!nomeCliente.trim()}
                onClick={() => setPasso(2)}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 2: Serviço ── */}
        {passo === 2 && (
          <div className="na-passo">
            <div className="na-passo-titulo">Serviço</div>
            <div className="na-servicos">
              {SERVICOS.map((s) => (
                <button
                  key={s}
                  className={`na-servico-btn ${servico === s ? "selecionado" : ""}`}
                  onClick={() => setServico(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="na-rodape">
              <button className="na-btn-voltar" onClick={() => setPasso(1)}>← Voltar</button>
              <button
                className="na-btn-avancar"
                disabled={!servico}
                onClick={() => setPasso(3)}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 3: Data ── */}
        {passo === 3 && (
          <div className="na-passo">
            <div className="na-passo-titulo">Data</div>

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
                  disabled={ehPassado(dia)}
                  className={`cal-dia
                    ${!dia ? "vazio" : ""}
                    ${ehHoje(dia) ? "hoje" : ""}
                    ${diaSelecionado === dia ? "selecionado" : ""}
                    ${ehPassado(dia) ? "passado" : ""}
                  `}
                  onClick={() => { if (dia && !ehPassado(dia)) setDiaSelecionado(dia); }}
                >
                  {dia || ""}
                </button>
              ))}
            </div>

            <div className="na-rodape">
              <button className="na-btn-voltar" onClick={() => setPasso(2)}>← Voltar</button>
              <button
                className="na-btn-avancar"
                disabled={!diaSelecionado}
                onClick={() => { setPasso(4); carregarHorarios(diaSelecionado); }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 4: Hora ── */}
        {passo === 4 && (
          <div className="na-passo">
            <div className="na-passo-titulo">Horário — {dataFormatada}</div>

            {carregandoHorarios ? (
              <div className="na-carregando">Carregando horários...</div>
            ) : (
              <div className="na-horarios-grid">
                {HORARIOS.map((h) => {
                  const ocupado = horariosOcupados.includes(h);
                  return (
                    <button
                      key={h}
                      disabled={ocupado}
                      className={`na-horario-btn
                        ${ocupado ? "ocupado" : ""}
                        ${horario === h ? "selecionado" : ""}
                      `}
                      onClick={() => { if (!ocupado) setHorario(h); }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}

            {erro && (
              <div className="na-erro">{erro}</div>
            )}

            <div className="na-rodape">
              <button className="na-btn-voltar" onClick={() => setPasso(3)}>← Voltar</button>
              <button
                className="na-btn-salvar"
                disabled={!horario || salvando}
                onClick={salvar}
              >
                {salvando ? "Salvando..." : "Confirmar agendamento"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Resumo dos dados já preenchidos */}
      {(nomeCliente || servico || diaSelecionado) && (
        <div className="na-resumo">
          {nomeCliente && <span className="na-resumo-item">{nomeCliente}</span>}
          {servico && <span className="na-resumo-sep">·</span>}
          {servico && <span className="na-resumo-item">{servico}</span>}
          {diaSelecionado && <span className="na-resumo-sep">·</span>}
          {diaSelecionado && <span className="na-resumo-item">{dataFormatada}</span>}
          {horario && <span className="na-resumo-sep">·</span>}
          {horario && <span className="na-resumo-item">{horario}</span>}
        </div>
      )}
    </>
  );
}

const cssStr = `
  .na-steps {
    display: flex;
    align-items: center;
    margin-bottom: 32px;
    gap: 0;
  }
  .na-step {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }
  .na-step-num {
    width: 28px;
    height: 28px;
    border: 1px solid rgba(26,18,9,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: rgba(26,18,9,0.4);
    font-family: 'Playfair Display', serif;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .na-step.ativo .na-step-num {
    background: #1a1209;
    border-color: #1a1209;
    color: #f5ede3;
  }
  .na-step.feito .na-step-num {
    background: rgba(26,18,9,0.08);
    border-color: rgba(26,18,9,0.4);
    color: #1a1209;
    font-size: 11px;
  }
  .na-step-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.35);
    white-space: nowrap;
  }
  .na-step.ativo .na-step-label { color: #1a1209; }
  .na-step.feito .na-step-label { color: rgba(26,18,9,0.55); }
  .na-step-line {
    flex: 1;
    height: 1px;
    background: rgba(26,18,9,0.15);
    margin: 0 8px;
  }

  .na-card {
    border: 1px solid rgba(26,18,9,0.15);
    background: rgba(255,255,255,0.5);
    padding: 32px;
    margin-bottom: 24px;
    max-width: 520px;
  }

  .na-passo-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: #1a1209;
    margin-bottom: 24px;
  }

  .na-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(26,18,9,0.25);
    background: rgba(255,255,255,0.7);
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    color: #1a1209;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 24px;
  }
  .na-input:focus { border-color: #1a1209; }
  .na-input::placeholder { color: rgba(26,18,9,0.3); }

  .na-servicos {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }
  .na-servico-btn {
    padding: 14px 20px;
    text-align: left;
    border: 1px solid rgba(26,18,9,0.2);
    background: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    color: rgba(26,18,9,0.65);
    cursor: pointer;
    transition: all 0.15s;
  }
  .na-servico-btn:hover { border-color: rgba(26,18,9,0.45); color: #1a1209; background: rgba(26,18,9,0.03); }
  .na-servico-btn.selecionado {
    background: #1a1209;
    border-color: #1a1209;
    color: #f5ede3;
  }

  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .cal-mes {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    letter-spacing: 2px;
    color: #1a1209;
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
  .cal-nav:hover { background: rgba(26,18,9,0.06); }
  .cal-semana {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8px;
  }
  .cal-semana span {
    text-align: center;
    font-size: 10px;
    letter-spacing: 1px;
    color: rgba(26,18,9,0.35);
    text-transform: uppercase;
    padding: 4px 0;
  }
  .cal-dias {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 24px;
  }
  .cal-dia {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid transparent;
    color: rgba(26,18,9,0.7);
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cal-dia:hover:not(.vazio):not(.passado) { border-color: rgba(26,18,9,0.25); color: #1a1209; }
  .cal-dia.vazio { cursor: default; pointer-events: none; }
  .cal-dia.passado { color: rgba(26,18,9,0.2); cursor: default; }
  .cal-dia.hoje { border-color: rgba(26,18,9,0.3); color: #7a5920; font-weight: 600; }
  .cal-dia.selecionado { background: #1a1209; border-color: #1a1209; color: #f5ede3; }

  .na-horarios-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
  .na-horario-btn {
    padding: 11px 4px;
    text-align: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px;
    letter-spacing: 1px;
    border: 1px solid rgba(26,18,9,0.18);
    background: none;
    color: rgba(26,18,9,0.65);
    cursor: pointer;
    transition: all 0.15s;
  }
  .na-horario-btn:hover:not(.ocupado) { border-color: rgba(26,18,9,0.4); color: #1a1209; }
  .na-horario-btn.ocupado {
    background: rgba(26,18,9,0.04);
    border-color: rgba(26,18,9,0.1);
    color: rgba(26,18,9,0.2);
    cursor: not-allowed;
    text-decoration: line-through;
  }
  .na-horario-btn.selecionado {
    background: #1a1209;
    border-color: #1a1209;
    color: #f5ede3;
  }

  .na-carregando {
    text-align: center;
    padding: 40px 0;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.4);
    margin-bottom: 24px;
  }

  .na-rodape {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-top: 4px;
  }
  .na-btn-voltar {
    background: none;
    border: 1px solid rgba(26,18,9,0.25);
    color: rgba(26,18,9,0.6);
    padding: 10px 20px;
    cursor: pointer;
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    letter-spacing: 2px;
    transition: all 0.2s;
  }
  .na-btn-voltar:hover { border-color: rgba(26,18,9,0.5); color: #1a1209; }
  .na-btn-avancar {
    background: #1a1209;
    border: none;
    color: #f5ede3;
    padding: 10px 24px;
    cursor: pointer;
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    letter-spacing: 2px;
    transition: all 0.2s;
  }
  .na-btn-avancar:hover:not(:disabled) { background: #2e2010; }
  .na-btn-avancar:disabled { opacity: 0.35; cursor: not-allowed; }
  .na-btn-salvar {
    background: #1a1209;
    border: none;
    color: #f5ede3;
    padding: 10px 24px;
    cursor: pointer;
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    letter-spacing: 2px;
    transition: all 0.2s;
  }
  .na-btn-salvar:hover:not(:disabled) { background: #2e2010; }
  .na-btn-salvar:disabled { opacity: 0.35; cursor: not-allowed; }

  .na-erro {
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 12px;
    letter-spacing: 1px;
    border: 1px solid rgba(192,57,43,0.5);
    color: #c0392b;
    background: rgba(192,57,43,0.05);
  }

  .na-resumo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 14px 0;
    border-top: 1px solid rgba(26,18,9,0.1);
    max-width: 520px;
  }
  .na-resumo-item {
    font-size: 13px;
    color: rgba(26,18,9,0.55);
    letter-spacing: 1px;
  }
  .na-resumo-sep {
    color: rgba(26,18,9,0.25);
  }

  .na-sucesso {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 0;
    gap: 16px;
    max-width: 520px;
  }
  .na-sucesso-icon {
    width: 56px;
    height: 56px;
    border: 1px solid rgba(26,18,9,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #1a1209;
    background: rgba(255,255,255,0.5);
  }
  .na-sucesso-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    color: #1a1209;
  }
  .na-sucesso-detalhe {
    font-size: 15px;
    color: rgba(26,18,9,0.6);
    text-align: center;
    line-height: 1.7;
    letter-spacing: 1px;
  }
  .na-btn-novo {
    margin-top: 8px;
    background: none;
    border: 1px solid rgba(26,18,9,0.3);
    color: #1a1209;
    padding: 10px 24px;
    cursor: pointer;
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    letter-spacing: 2px;
    transition: all 0.2s;
  }
  .na-btn-novo:hover { background: rgba(26,18,9,0.06); }

  @media (max-width: 600px) {
    .na-card { padding: 20px 16px; }
    .na-step-label { display: none; }
    .na-horarios-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .na-horario-btn { padding: 12px 2px; font-size: 13px; }
    .na-btn-avancar, .na-btn-salvar { padding: 10px 16px; font-size: 12px; }
  }
`;
