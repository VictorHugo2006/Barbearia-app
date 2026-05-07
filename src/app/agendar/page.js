"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SERVICOS = ["Corte", "Barba", "Corte + Barba", "Depilação do nariz"];

const HORARIOS = [
  "08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30",
];

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const PASSOS = ["Nome","Telefone","Serviço","Profissional","Data","Hora"];

// ⚙️ Número do WhatsApp da barbearia (DDI 55 + DDD + número, sem símbolos)
const WHATSAPP_BARBEARIA = "5500000000000"; // ← altere para o número da Dom Navalha

export default function AgendarPage() {
  const hoje = new Date();

  const [passo, setPasso]               = useState(0);
  const [nome, setNome]                 = useState("");
  const [telefone, setTelefone]         = useState("");
  const [servico, setServico]           = useState("");
  const [barbeiro, setBarbeiro]         = useState(null);
  const [barbeiros, setBarbeiros]       = useState([]);
  const [mes, setMes]                   = useState(hoje.getMonth());
  const [ano, setAno]                   = useState(hoje.getFullYear());
  const [dia, setDia]                   = useState(null);
  const [horario, setHorario]           = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [salvando, setSalvando]         = useState(false);
  const [sucesso, setSucesso]           = useState(false);
  const [erro, setErro]                 = useState(null);
  const [mostrarEquipe, setMostrarEquipe] = useState(false);

  useEffect(() => {
    supabase.from("barbeiros").select("*").order("nome")
      .then(({ data }) => setBarbeiros(data || []));
  }, []);

  // ── Calendário ──────────────────────────────────
  function diasDoMes() {
    const dias = [];
    const primeiro = new Date(ano, mes, 1).getDay();
    const total = new Date(ano, mes + 1, 0).getDate();
    for (let i = 0; i < primeiro; i++) dias.push(null);
    for (let i = 1; i <= total; i++) dias.push(i);
    return dias;
  }

  const ehHoje = (d) => d === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
  const ehPassado = (d) => {
    if (!d) return false;
    return new Date(ano, mes, d) < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  };

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else setMes(mes - 1);
    setDia(null);
  }
  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else setMes(mes + 1);
    setDia(null);
  }

  // ── Ao selecionar dia ────────────────────────────
  async function selecionarDia(d) {
    if (!d || ehPassado(d)) return;
    setDia(d);
    setPasso(5);
    setCarregandoHorarios(true);
    setHorario("");

    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const [{ data: ags }, { data: blq }] = await Promise.all([
      supabase.from("agendamentos").select("data_hora")
        .eq("barbeiro", barbeiro.nome)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`),
      supabase.from("bloqueios").select("data_hora")
        .eq("barbeiro_id", barbeiro.id)
        .gte("data_hora", `${dataStr}T00:00:00`)
        .lt("data_hora", `${dataStr}T23:59:59`),
    ]);

    setHorariosOcupados([
      ...(ags || []).map((a) => a.data_hora.slice(11,16)),
      ...(blq || []).map((b) => b.data_hora.slice(11,16)),
    ]);
    setCarregandoHorarios(false);
  }

  // ── Confirmar agendamento ────────────────────────
  async function confirmar() {
    setSalvando(true);
    setErro(null);
    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;

    const { error } = await supabase.from("agendamentos").insert({
      nome_cliente: nome.trim(),
      telefone: telefone.trim(),
      servico,
      barbeiro: barbeiro.nome,
      data_hora: `${dataStr}T${horario}:00`,
      status: "agendado",
    });

    if (error) {
      setErro("Erro ao agendar. Tente novamente.");
      setSalvando(false);
      return;
    }
    setSucesso(true);
    setSalvando(false);
  }

  // ── Selecionar barbeiro (modal da equipe) ────────
  function escolherBarbeiro(b) {
    setBarbeiro(b);
    setMostrarEquipe(false);
    setPasso(4);
  }

  // ── Link WhatsApp ────────────────────────────────
  function linkWhatsApp() {
    const msg =
      `Seu agendamento foi confirmado com ${barbeiro?.nome}, ` +
      `dia ${dataFormatada} às ${horario} ` +
      `para o serviço de ${servico}. ` +
      `Te esperamos na DOM NAVALHA.`;
    return `https://wa.me/${WHATSAPP_BARBEARIA}?text=${encodeURIComponent(msg)}`;
  }

  // ── Formatação de telefone ───────────────────────
  function formatarTelefone(val) {
    const nums = val.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
  }

  const dataFormatada = dia
    ? `${String(dia).padStart(2,"0")} de ${MESES[mes]} de ${ano}`
    : "";

  // ── Tela de sucesso ──────────────────────────────
  if (sucesso) return (
    <>
      <style>{css}</style>
      <div className="ag-root">
        <header className="ag-header">
          <img src="/logo.png" alt="Dom Navalha" className="ag-logo"
            onError={(e) => { e.target.style.display="none"; }} />
          <div className="ag-brand">Dom <span>Navalha</span></div>
        </header>
        <div className="ag-sucesso">
          <div className="ag-check-wrap">
            <svg className="ag-check-svg" viewBox="0 0 52 52">
              <circle className="ag-check-circle" cx="26" cy="26" r="24" fill="none" strokeWidth="2"/>
              <path  className="ag-check-path"   fill="none" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                d="M14 27 l8 8 l16-16"/>
            </svg>
          </div>
          <h2 className="ag-sucesso-titulo">Agendamento confirmado!</h2>
        </div>
      </div>
    </>
  );

  // ── Progresso ────────────────────────────────────
  const progresso = ((passo) / (PASSOS.length - 1)) * 100;

  return (
    <>
      <style>{css}</style>
      <div className="ag-root">

        {/* Header */}
        <header className="ag-header">
          <a href="/" className="ag-voltar">← Voltar</a>
          <img src="/logo.png" alt="Dom Navalha" className="ag-logo"
            onError={(e) => { e.target.style.display="none"; }} />
          <div className="ag-brand">Dom <span>Navalha</span></div>
        </header>

        {/* Barra de progresso */}
        <div className="ag-progress-bar">
          <div className="ag-progress-fill" style={{ width: `${progresso}%` }} />
        </div>

        {/* Indicador de passo */}
        <div className="ag-passo-label">
          {PASSOS[passo]} <span>{passo + 1}/{PASSOS.length}</span>
        </div>

        {/* Conteúdo */}
        <main className="ag-main">

          {/* Passo 0: Nome */}
          {passo === 0 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Qual é o seu nome?</h2>
              <input
                className="ag-input"
                type="text"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && nome.trim()) setPasso(1); }}
                autoFocus
              />
              <button className="ag-btn-primario" disabled={!nome.trim()} onClick={() => setPasso(1)}>
                Continuar
              </button>
            </div>
          )}

          {/* Passo 1: Telefone */}
          {passo === 1 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Seu telefone</h2>
              <p className="ag-subtitulo">Para contato em caso de imprevistos</p>
              <input
                className="ag-input"
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter" && telefone.length >= 14) setPasso(2); }}
                autoFocus
              />
              <button className="ag-btn-primario" disabled={telefone.length < 14} onClick={() => setPasso(2)}>
                Continuar
              </button>
              <button className="ag-btn-voltar" onClick={() => setPasso(0)}>← Voltar</button>
            </div>
          )}

          {/* Passo 2: Serviço */}
          {passo === 2 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Qual serviço?</h2>
              <div className="ag-opcoes">
                {SERVICOS.map((s) => (
                  <button
                    key={s}
                    className={`ag-opcao ${servico === s ? "ativo" : ""}`}
                    onClick={() => { setServico(s); setPasso(3); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button className="ag-btn-voltar" onClick={() => setPasso(1)}>← Voltar</button>
            </div>
          )}

          {/* Passo 3: Profissional */}
          {passo === 3 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Com quem?</h2>
              <div className="ag-opcoes">
                {barbeiros.map((b) => (
                  <button
                    key={b.id}
                    className={`ag-opcao ag-opcao-prof ${barbeiro?.id === b.id ? "ativo" : ""}`}
                    onClick={() => { setBarbeiro(b); setPasso(4); }}
                  >
                    {b.foto_url
                      ? <img src={b.foto_url} alt={b.nome} className="ag-prof-foto" />
                      : <div className="ag-prof-iniciais">
                          {b.nome.split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                    }
                    <span className="ag-prof-nome">{b.nome}</span>
                  </button>
                ))}
              </div>

              {/* Não conheço ninguém */}
              <button className="ag-btn-conhecer" onClick={() => setMostrarEquipe(true)}>
                Não conheço ninguém — conheça a equipe →
              </button>

              <button className="ag-btn-voltar" onClick={() => setPasso(2)}>← Voltar</button>
            </div>
          )}

          {/* Passo 4: Data */}
          {passo === 4 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Qual data?</h2>
              <p className="ag-subtitulo">Clique no dia para ver os horários</p>

              <div className="ag-cal">
                <div className="ag-cal-header">
                  <button className="ag-cal-nav" onClick={mesAnterior}>‹</button>
                  <span className="ag-cal-mes">{MESES[mes]} {ano}</span>
                  <button className="ag-cal-nav" onClick={proximoMes}>›</button>
                </div>
                <div className="ag-cal-semana">
                  {["D","S","T","Q","Q","S","S"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="ag-cal-dias">
                  {diasDoMes().map((d, i) => (
                    <button
                      key={i}
                      disabled={!d || ehPassado(d)}
                      className={`ag-cal-dia
                        ${!d ? "vazio" : ""}
                        ${ehHoje(d) ? "hoje" : ""}
                        ${ehPassado(d) ? "passado" : ""}
                        ${dia === d ? "selecionado" : ""}
                      `}
                      onClick={() => selecionarDia(d)}
                    >
                      {d || ""}
                    </button>
                  ))}
                </div>
              </div>

              <button className="ag-btn-voltar" onClick={() => setPasso(3)}>← Voltar</button>
            </div>
          )}

          {/* Passo 5: Hora */}
          {passo === 5 && (
            <div className="ag-step">
              <h2 className="ag-titulo">Qual horário?</h2>
              <p className="ag-subtitulo">{dataFormatada} · {barbeiro?.nome}</p>

              {carregandoHorarios ? (
                <div className="ag-carregando">Verificando disponibilidade...</div>
              ) : (
                <div className="ag-horarios">
                  {HORARIOS.map((h) => {
                    const ocupado = horariosOcupados.includes(h);
                    return (
                      <button
                        key={h}
                        disabled={ocupado}
                        className={`ag-horario ${ocupado ? "ocupado" : ""} ${horario === h ? "ativo" : ""}`}
                        onClick={() => setHorario(h)}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}

              {horario && (
                <div className="ag-resumo-final">
                  <div className="ag-resumo-titulo">Resumo do agendamento</div>
                  <div className="ag-resumo-item"><span>Nome</span>{nome}</div>
                  <div className="ag-resumo-item"><span>Serviço</span>{servico}</div>
                  <div className="ag-resumo-item"><span>Profissional</span>{barbeiro.nome}</div>
                  <div className="ag-resumo-item"><span>Data e hora</span>{dataFormatada} às {horario}</div>
                </div>
              )}

              {erro && <p className="ag-erro">{erro}</p>}

              <button
                className="ag-btn-primario"
                disabled={!horario || salvando}
                onClick={confirmar}
              >
                {salvando ? "Agendando..." : "Confirmar agendamento"}
              </button>
              <button className="ag-btn-voltar" onClick={() => setPasso(4)}>← Voltar</button>
            </div>
          )}

        </main>
      </div>

      {/* ── Modal: Conheça a equipe ─────────────────── */}
      {mostrarEquipe && (
        <div className="ag-overlay" onClick={() => setMostrarEquipe(false)}>
          <div className="ag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ag-modal-topo">
              <div>
                <div className="ag-modal-titulo">Nossa equipe</div>
                <div className="ag-modal-sub">Clique em um profissional para agendar</div>
              </div>
              <button className="ag-modal-fechar" onClick={() => setMostrarEquipe(false)}>✕</button>
            </div>

            <div className="ag-equipe-grid">
              {barbeiros.map((b) => (
                <div key={b.id} className="ag-equipe-card" onClick={() => escolherBarbeiro(b)}>
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nome} className="ag-equipe-foto" />
                    : <div className="ag-equipe-iniciais">
                        {b.nome.split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                  }
                  <div className="ag-equipe-nome">{b.nome}</div>
                  <div className="ag-equipe-agendar">Agendar</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .ag-root {
    min-height: 100vh;
    background: #f5ede3;
    font-family: 'Cormorant Garamond', serif;
    color: #1a1209;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .ag-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(26,18,9,0.1);
    background: rgba(245,237,227,0.97);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .ag-logo { height: 52px; width: auto; object-fit: contain; }
  .ag-voltar {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px;
    letter-spacing: 1px;
    color: rgba(26,18,9,0.45);
    text-decoration: none;
    transition: color 0.15s;
    white-space: nowrap;
  }
  .ag-voltar:hover { color: #1a1209; }
  .ag-brand {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #1a1209;
  }
  .ag-brand span { color: #7a5920; }

  /* Progresso */
  .ag-progress-bar {
    height: 3px;
    background: rgba(26,18,9,0.1);
  }
  .ag-progress-fill {
    height: 100%;
    background: #1a1209;
    transition: width 0.4s ease;
  }
  .ag-passo-label {
    padding: 10px 24px;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.45);
    border-bottom: 1px solid rgba(26,18,9,0.08);
  }
  .ag-passo-label span {
    float: right;
    color: rgba(26,18,9,0.3);
  }

  /* Main */
  .ag-main {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 24px 60px;
  }
  .ag-step {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ag-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    color: #1a1209;
    margin-bottom: 4px;
  }
  .ag-subtitulo {
    font-size: 14px;
    color: rgba(26,18,9,0.5);
    letter-spacing: 1px;
    margin-top: -8px;
  }

  /* Input texto */
  .ag-input {
    width: 100%;
    padding: 14px 18px;
    border: 1px solid rgba(26,18,9,0.3);
    background: #fff;
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    color: #1a1209;
    outline: none;
    transition: border-color 0.2s;
  }
  .ag-input:focus { border-color: #1a1209; }
  .ag-input::placeholder { color: rgba(26,18,9,0.3); }

  /* Opções (serviço / profissional) */
  .ag-opcoes {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ag-opcao {
    padding: 16px 20px;
    border: 1px solid rgba(26,18,9,0.2);
    background: #fff;
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    color: #1a1209;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }
  .ag-opcao:hover { border-color: rgba(26,18,9,0.5); background: rgba(255,255,255,0.9); }
  .ag-opcao.ativo { background: #1a1209; border-color: #1a1209; color: #f5ede3; }

  /* Profissional */
  .ag-opcao-prof {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ag-prof-foto {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(26,18,9,0.15);
    flex-shrink: 0;
  }
  .ag-prof-iniciais {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(26,18,9,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    color: #1a1209;
    background: rgba(245,237,227,0.8);
    flex-shrink: 0;
  }
  .ag-opcao.ativo .ag-prof-iniciais { background: rgba(255,255,255,0.15); color: #f5ede3; border-color: rgba(255,255,255,0.3); }
  .ag-prof-nome { font-size: 18px; }

  /* Botão "Não conheço ninguém" */
  .ag-btn-conhecer {
    background: none;
    border: 1px dashed rgba(26,18,9,0.25);
    color: #7a5920;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 15px;
    padding: 14px 18px;
    cursor: pointer;
    text-align: left;
    letter-spacing: 0.5px;
    transition: all 0.15s;
    width: 100%;
  }
  .ag-btn-conhecer:hover {
    border-color: #7a5920;
    background: rgba(122,89,32,0.04);
  }

  /* Calendário */
  .ag-cal {
    background: #fff;
    border: 1px solid rgba(26,18,9,0.15);
    padding: 20px;
  }
  .ag-cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .ag-cal-mes {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    letter-spacing: 2px;
    color: #1a1209;
  }
  .ag-cal-nav {
    background: none;
    border: 1px solid rgba(26,18,9,0.2);
    color: #1a1209;
    width: 34px;
    height: 34px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .ag-cal-nav:hover { background: rgba(26,18,9,0.06); }
  .ag-cal-semana {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8px;
  }
  .ag-cal-semana span {
    text-align: center;
    font-size: 11px;
    letter-spacing: 1px;
    color: rgba(26,18,9,0.4);
    text-transform: uppercase;
    padding: 4px 0;
  }
  .ag-cal-dias {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .ag-cal-dia {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    color: #1a1209;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    transition: all 0.15s;
    border-radius: 2px;
  }
  .ag-cal-dia:hover:not(.vazio):not(.passado) {
    border-color: rgba(26,18,9,0.3);
    background: rgba(26,18,9,0.04);
  }
  .ag-cal-dia.vazio { cursor: default; pointer-events: none; }
  .ag-cal-dia.passado { color: rgba(26,18,9,0.2); cursor: default; }
  .ag-cal-dia.hoje { font-weight: 700; color: #7a5920; border-color: rgba(26,18,9,0.25); }
  .ag-cal-dia.selecionado { background: #1a1209; color: #f5ede3; border-color: #1a1209; }

  /* Horários */
  .ag-carregando {
    text-align: center;
    padding: 32px;
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.4);
  }
  .ag-horarios {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .ag-horario {
    padding: 14px 4px;
    text-align: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    letter-spacing: 1px;
    border: 1px solid rgba(26,18,9,0.18);
    background: #fff;
    color: #1a1209;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ag-horario:hover:not(.ocupado) { border-color: #1a1209; background: rgba(26,18,9,0.04); }
  .ag-horario.ocupado {
    background: rgba(26,18,9,0.04);
    border-color: rgba(26,18,9,0.08);
    color: rgba(26,18,9,0.2);
    cursor: not-allowed;
    text-decoration: line-through;
  }
  .ag-horario.ativo { background: #1a1209; border-color: #1a1209; color: #f5ede3; }

  /* Resumo final */
  .ag-resumo-final {
    border: 1px solid rgba(26,18,9,0.15);
    background: rgba(255,255,255,0.6);
    padding: 20px;
  }
  .ag-resumo-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: #1a1209;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }
  .ag-resumo-item {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    color: #1a1209;
    padding: 6px 0;
    border-bottom: 1px solid rgba(26,18,9,0.07);
  }
  .ag-resumo-item:last-child { border-bottom: none; }
  .ag-resumo-item span {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.45);
    align-self: center;
  }

  /* Botões */
  .ag-btn-primario {
    width: 100%;
    padding: 16px;
    background: #1a1209;
    border: none;
    color: #f5ede3;
    font-family: 'Playfair Display', serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    display: block;
    text-align: center;
  }
  .ag-btn-primario:hover:not(:disabled) { background: #2e2010; }
  .ag-btn-primario:disabled { opacity: 0.35; cursor: not-allowed; }

  .ag-btn-outline {
    background: none;
    border: 1px solid rgba(26,18,9,0.3);
    color: #1a1209;
  }
  .ag-btn-outline:hover:not(:disabled) { background: rgba(26,18,9,0.06); }

  .ag-btn-voltar {
    background: none;
    border: none;
    color: rgba(26,18,9,0.45);
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px;
    letter-spacing: 1px;
    cursor: pointer;
    padding: 4px 0;
    text-align: left;
    transition: color 0.15s;
  }
  .ag-btn-voltar:hover { color: #1a1209; }

  /* Botão WhatsApp */
  .ag-btn-whatsapp {
    width: 100%;
    padding: 16px;
    background: #25D366;
    border: none;
    color: #fff;
    font-family: 'Playfair Display', serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s;
  }
  .ag-btn-whatsapp:hover { background: #1ebe5a; }

  .ag-erro {
    color: #c0392b;
    font-size: 13px;
    letter-spacing: 1px;
    text-align: center;
    padding: 10px;
    border: 1px solid rgba(192,57,43,0.3);
    background: rgba(192,57,43,0.05);
  }

  /* Tela de sucesso */
  .ag-sucesso {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    flex: 1;
    padding: 48px 24px;
    animation: fadeUp 0.5s ease forwards;
  }

  /* Check animado */
  .ag-check-wrap {
    width: 82px;
    height: 82px;
    animation: checkPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
  }
  .ag-check-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 0 10px rgba(34,197,94,0.4));
  }
  .ag-check-circle {
    stroke: #22c55e;
    stroke-dasharray: 151;
    stroke-dashoffset: 151;
    stroke-linecap: round;
    animation: circleDraw 0.55s ease-out forwards;
  }
  .ag-check-path {
    stroke: #22c55e;
    stroke-dasharray: 36;
    stroke-dashoffset: 36;
    animation: checkDraw 0.3s ease-out 0.5s forwards;
  }

  @keyframes circleDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes checkDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0.6); opacity: 0; }
    70%  { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }

  .ag-sucesso-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    color: #1a1209;
    text-align: center;
  }
  .ag-sucesso-info {
    width: 100%;
    border: 1px solid rgba(26,18,9,0.15);
    background: #fff;
  }
  .ag-sucesso-linha {
    display: flex;
    justify-content: space-between;
    padding: 12px 18px;
    font-size: 15px;
    color: #1a1209;
    border-bottom: 1px solid rgba(26,18,9,0.07);
  }
  .ag-sucesso-linha:last-child { border-bottom: none; }
  .ag-sucesso-linha span {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.4);
    align-self: center;
  }
  .ag-sucesso-obs {
    font-size: 13px;
    color: rgba(26,18,9,0.45);
    letter-spacing: 1px;
    text-align: center;
  }

  /* ── Modal equipe ────────────────────────────── */
  .ag-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,8,4,0.65);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ag-modal {
    background: #f5ede3;
    width: 100%;
    max-width: 540px;
    max-height: 88vh;
    overflow-y: auto;
    padding: 28px 24px 40px;
    border-top: 1px solid rgba(26,18,9,0.15);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .ag-modal-topo {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .ag-modal-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: #1a1209;
    letter-spacing: 1px;
  }
  .ag-modal-sub {
    font-size: 13px;
    color: rgba(26,18,9,0.45);
    letter-spacing: 1px;
    margin-top: 4px;
    font-style: italic;
  }
  .ag-modal-fechar {
    background: none;
    border: 1px solid rgba(26,18,9,0.2);
    color: rgba(26,18,9,0.5);
    width: 34px;
    height: 34px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .ag-modal-fechar:hover { background: rgba(26,18,9,0.06); color: #1a1209; }

  /* Grid de profissionais no modal */
  .ag-equipe-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .ag-equipe-card {
    background: #fff;
    border: 1px solid rgba(26,18,9,0.12);
    padding: 24px 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .ag-equipe-card:hover {
    border-color: #1a1209;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(26,18,9,0.08);
  }
  .ag-equipe-foto {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(26,18,9,0.12);
  }
  .ag-equipe-iniciais {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px solid rgba(26,18,9,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    color: #1a1209;
    background: rgba(245,237,227,0.8);
  }
  .ag-equipe-nome {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    color: #1a1209;
    letter-spacing: 0.5px;
  }
  .ag-equipe-agendar {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.4);
    border-top: 1px solid rgba(26,18,9,0.08);
    padding-top: 10px;
    width: 100%;
    text-align: center;
    transition: color 0.15s;
  }
  .ag-equipe-card:hover .ag-equipe-agendar { color: #1a1209; }

  @media (max-width: 480px) {
    .ag-main { padding: 28px 16px 48px; }
    .ag-titulo { font-size: 24px; }
    .ag-horarios { grid-template-columns: repeat(3, 1fr); }
    .ag-horario { padding: 13px 4px; font-size: 14px; }
    .ag-cal { padding: 14px; }
    .ag-equipe-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .ag-equipe-foto, .ag-equipe-iniciais { width: 64px; height: 64px; }
    .ag-equipe-iniciais { font-size: 20px; }
    .ag-modal { padding: 24px 16px 36px; }
  }
`;
