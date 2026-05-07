"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ⚙️ Configurações — edite aqui
const WHATSAPP_NUM   = "5547988803447";
const INSTAGRAM_USER = "domnavalhagaspar";
const ENDERECO_TEXTO = "Rua — altere para o endereço completo, Gaspar, SC"; // ← altere
const MAPS_EMBED     = "https://maps.google.com/maps?q=dom+navalha+gaspar+sc&output=embed"; // ← cole o link embed do Google Maps

const HORARIOS_FUNC = [
  { dia: "Seg", h: "09:00 às 19:00" },
  { dia: "Ter", h: "09:00 às 19:00" },
  { dia: "Qua", h: "09:00 às 19:00" },
  { dia: "Qui", h: "09:00 às 19:00" },
  { dia: "Sex", h: "09:00 às 19:00" },
  { dia: "Sáb", h: "08:00 às 13:00" },
  { dia: "Dom", h: "Fechado"         },
];

const PAGAMENTOS = ["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito"];

// ⚙️ Serviços e preços — edite os valores
const SERVICOS_INFO = [
  { cat: "Corte",  items: [{ nome: "Corte",             tempo: "30 min", preco: "R$ 40,00" }] },
  { cat: "Barba",  items: [{ nome: "Barba",              tempo: "30 min", preco: "R$ 35,00" }] },
  { cat: "Combo",  items: [{ nome: "Corte + Barba",      tempo: "60 min", preco: "R$ 65,00" }] },
  { cat: "Outros", items: [{ nome: "Depilação do nariz", tempo: "15 min", preco: "R$ 20,00" }] },
];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmtTel(val) {
  const n = val.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

function fmtDataHora(dh) {
  const [datePart, timePart] = dh.split("T");
  const [y, m, d] = datePart.split("-");
  return {
    data: `${parseInt(d)} de ${MESES[parseInt(m)-1]} de ${y}`,
    hora: timePart.slice(0, 5),
  };
}

// ── Ícones ────────────────────────────────────────
const IcoCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoWhatsApp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IcoInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);
const IcoInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

// ── Componente principal ──────────────────────────
export default function HomePage() {
  const [popup, setPopup]         = useState(null); // null | "info" | "ags"
  const [tabInfo, setTabInfo]     = useState(0);
  const [barbeiros, setBarbeiros] = useState([]);
  const [tel, setTel]             = useState("");
  const [buscando, setBuscando]   = useState(false);
  const [meusAgs, setMeusAgs]     = useState(null);

  useEffect(() => {
    if (popup === "info") {
      supabase.from("barbeiros").select("*").order("nome")
        .then(({ data }) => setBarbeiros(data || []));
    }
  }, [popup]);

  function fechar() {
    setPopup(null);
    setTabInfo(0);
    setTel("");
    setMeusAgs(null);
  }

  async function buscar() {
    if (tel.length < 14) return;
    setBuscando(true);
    const hoje = new Date();
    const hojeStr =
      `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}T00:00:00`;
    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("telefone", tel)
      .gte("data_hora", hojeStr)
      .neq("status", "cancelado")
      .order("data_hora");
    setMeusAgs(data || []);
    setBuscando(false);
  }

  return (
    <>
      <style>{css}</style>
      <div className="hn-root">

        {/* Hero */}
        <div className="hn-hero">
          <img src="/logo.png" alt="Dom Navalha" className="hn-logo"
            onError={(e) => { e.target.style.display = "none"; }} />
          <h1 className="hn-titulo">Dom <span>Navalha</span></h1>
          <p className="hn-barber-club">Barber Club</p>
        </div>

        {/* Botões */}
        <div className="hn-btns">
          <a href="/agendar" className="hn-btn">
            <IcoCalendar /> Agende seu horário
          </a>
          <a href={`https://wa.me/${WHATSAPP_NUM}`} target="_blank" rel="noopener noreferrer" className="hn-btn">
            <IcoWhatsApp /> WhatsApp
          </a>
          <a href={`https://instagram.com/${INSTAGRAM_USER}`} target="_blank" rel="noopener noreferrer" className="hn-btn">
            <IcoInstagram /> Instagram
          </a>
          <button className="hn-btn" onClick={() => setPopup("info")}>
            <IcoInfo /> Informações da barbearia
          </button>
          <button className="hn-btn" onClick={() => setPopup("ags")}>
            <IcoUser /> Meus agendamentos
          </button>
        </div>

        <p className="hn-footer">Dom Navalha © 2025</p>
      </div>

      {/* ── Popup Informações ─────────────────────── */}
      {popup === "info" && (
        <div className="hn-overlay" onClick={fechar}>
          <div className="hn-modal" onClick={(e) => e.stopPropagation()}>

            <div className="hn-modal-top">
              <span className="hn-modal-titulo">Informações</span>
              <button className="hn-modal-fechar" onClick={fechar}>✕</button>
            </div>

            <div className="hn-tabs">
              {["Informações","Serviços","Profissionais"].map((t, i) => (
                <button key={t} className={`hn-tab ${tabInfo === i ? "ativo" : ""}`}
                  onClick={() => setTabInfo(i)}>{t}</button>
              ))}
            </div>

            <div className="hn-tab-body">

              {/* Tab 0: Informações */}
              {tabInfo === 0 && (
                <div className="hn-info-grid">
                  <div>
                    <h3 className="hn-section-titulo">Horários de atendimento</h3>
                    <div className="hn-horarios-lista">
                      {HORARIOS_FUNC.map(({ dia, h }) => (
                        <div key={dia} className="hn-horario-row">
                          <span className="hn-dia">{dia}</span>
                          <span className={h === "Fechado" ? "hn-fechado" : ""}>{h}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="hn-section-titulo" style={{ marginTop: 28 }}>Formas de pagamento</h3>
                    <div className="hn-pagamentos">
                      {PAGAMENTOS.map((p) => (
                        <span key={p} className="hn-pagamento-item">• {p}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="hn-section-titulo">Endereço</h3>
                    <p className="hn-endereco-texto">{ENDERECO_TEXTO}</p>
                    <div className="hn-mapa">
                      <iframe
                        src={MAPS_EMBED}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Serviços */}
              {tabInfo === 1 && (
                <div className="hn-servicos-grid">
                  {SERVICOS_INFO.map(({ cat, items }) => (
                    <div key={cat} className="hn-servico-cat">
                      <h3 className="hn-section-titulo">{cat}</h3>
                      {items.map((item) => (
                        <div key={item.nome} className="hn-servico-row">
                          <div>
                            <div className="hn-servico-nome">{item.nome}</div>
                            <div className="hn-servico-tempo">⏱ {item.tempo}</div>
                          </div>
                          <div className="hn-servico-preco">{item.preco}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Profissionais */}
              {tabInfo === 2 && (
                <div className="hn-profs-grid">
                  {barbeiros.length === 0 && (
                    <p style={{ color: "rgba(26,18,9,0.4)", fontSize: 14 }}>Carregando...</p>
                  )}
                  {barbeiros.map((b) => (
                    <div key={b.id} className="hn-prof-card">
                      {b.foto_url
                        ? <img src={b.foto_url} alt={b.nome} className="hn-prof-foto" />
                        : <div className="hn-prof-iniciais">
                            {b.nome.split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                      }
                      <span className="hn-prof-nome">{b.nome}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Popup Meus agendamentos ───────────────── */}
      {popup === "ags" && (
        <div className="hn-overlay" onClick={fechar}>
          <div className="hn-modal" onClick={(e) => e.stopPropagation()}>

            <div className="hn-modal-top">
              <span className="hn-modal-titulo">Meus agendamentos</span>
              <button className="hn-modal-fechar" onClick={fechar}>✕</button>
            </div>

            <div className="hn-tab-body">
              {meusAgs === null ? (
                <div className="hn-busca-wrap">
                  <p className="hn-busca-desc">
                    Digite seu número de WhatsApp para ver seus agendamentos
                  </p>
                  <input
                    className="hn-busca-input"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={tel}
                    onChange={(e) => setTel(fmtTel(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
                    autoFocus
                  />
                  <button
                    className="hn-busca-btn"
                    disabled={tel.length < 14 || buscando}
                    onClick={buscar}
                  >
                    {buscando ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              ) : meusAgs.length === 0 ? (
                <div className="hn-vazio">
                  <div className="hn-vazio-ico">📅</div>
                  <p>Nenhum agendamento encontrado para este número.</p>
                  <button className="hn-voltar-link" onClick={() => { setMeusAgs(null); setTel(""); }}>
                    ← Tentar outro número
                  </button>
                </div>
              ) : (
                <div className="hn-ags-lista">
                  <p className="hn-ags-count">
                    {meusAgs.length} agendamento{meusAgs.length > 1 ? "s" : ""} encontrado{meusAgs.length > 1 ? "s" : ""}
                  </p>
                  {meusAgs.map((ag) => {
                    const { data, hora } = fmtDataHora(ag.data_hora);
                    return (
                      <div key={ag.id} className="hn-ag-card">
                        <div className="hn-ag-top">
                          <span className="hn-ag-servico">{ag.servico}</span>
                          <span className={`hn-ag-status hn-ag-status-${ag.status}`}>{ag.status}</span>
                        </div>
                        <div className="hn-ag-info">
                          <span>✂️ {ag.barbeiro}</span>
                          <span>📅 {data}</span>
                          <span>⏰ {hora}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="hn-voltar-link" onClick={() => { setMeusAgs(null); setTel(""); }}>
                    ← Buscar outro número
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── CSS ───────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .hn-root {
    min-height: 100vh;
    background: #f5ede3;
    background-image: repeating-linear-gradient(
      45deg, transparent, transparent 18px,
      rgba(26,18,9,0.025) 18px, rgba(26,18,9,0.025) 19px);
    font-family: 'Cormorant Garamond', serif;
    color: #1a1209;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 52px 20px 36px;
  }

  /* Hero */
  .hn-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 44px;
  }
  .hn-logo { height: 100px; width: auto; object-fit: contain; margin-bottom: 8px; }
  .hn-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: #1a1209;
  }
  .hn-titulo span { color: #7a5920; }
  .hn-barber-club {
    font-style: italic;
    font-size: 13px;
    letter-spacing: 4px;
    color: #5a3e1b;
    text-transform: uppercase;
  }

  /* Botões */
  .hn-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 440px;
  }
  .hn-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 17px 22px;
    background: #1a1209;
    border: none;
    color: #f5ede3;
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    letter-spacing: 1px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    border-radius: 2px;
  }
  .hn-btn:hover { background: #2e2010; transform: translateX(4px); }
  .hn-btn svg { flex-shrink: 0; opacity: 0.75; }

  .hn-footer {
    margin-top: 52px;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(26,18,9,0.3);
  }

  /* Overlay */
  .hn-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,8,4,0.6);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: overlayIn 0.2s ease;
  }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

  .hn-modal {
    background: #fff;
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    border-top: 3px solid #1a1209;
    animation: slideUp 0.3s ease;
    overflow: hidden;
  }
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .hn-modal-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(26,18,9,0.08);
    flex-shrink: 0;
  }
  .hn-modal-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: #1a1209;
    letter-spacing: 1px;
  }
  .hn-modal-fechar {
    background: none;
    border: 1px solid rgba(26,18,9,0.2);
    color: rgba(26,18,9,0.5);
    width: 32px;
    height: 32px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    border-radius: 2px;
  }
  .hn-modal-fechar:hover { background: rgba(26,18,9,0.06); color: #1a1209; }

  /* Tabs */
  .hn-tabs {
    display: flex;
    border-bottom: 1px solid rgba(26,18,9,0.1);
    flex-shrink: 0;
  }
  .hn-tab {
    flex: 1;
    padding: 13px 8px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    letter-spacing: 1px;
    color: rgba(26,18,9,0.45);
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: -1px;
  }
  .hn-tab:hover { color: #1a1209; }
  .hn-tab.ativo { color: #1a1209; border-bottom-color: #1a1209; font-weight: 600; }

  .hn-tab-body { flex: 1; overflow-y: auto; padding: 24px; }

  /* Tab Informações */
  .hn-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .hn-section-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    color: #1a1209;
    margin-bottom: 14px;
  }
  .hn-horarios-lista { display: flex; flex-direction: column; gap: 8px; }
  .hn-horario-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    color: #1a1209;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(26,18,9,0.06);
  }
  .hn-dia { color: rgba(26,18,9,0.45); font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
  .hn-fechado { color: rgba(26,18,9,0.3); font-style: italic; }
  .hn-pagamentos { display: flex; flex-direction: column; gap: 7px; }
  .hn-pagamento-item { font-size: 15px; color: #1a1209; }
  .hn-endereco-texto { font-size: 15px; color: #1a1209; margin-bottom: 14px; line-height: 1.5; }
  .hn-mapa { width: 100%; height: 200px; border: 1px solid rgba(26,18,9,0.12); overflow: hidden; border-radius: 2px; }

  /* Tab Serviços */
  .hn-servicos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .hn-servico-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(26,18,9,0.07);
  }
  .hn-servico-nome { font-size: 15px; color: #1a1209; font-weight: 600; }
  .hn-servico-tempo { font-size: 12px; color: rgba(26,18,9,0.4); margin-top: 2px; }
  .hn-servico-preco { font-family: 'Playfair Display', serif; font-size: 15px; color: #7a5920; white-space: nowrap; }

  /* Tab Profissionais */
  .hn-profs-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 8px 0; }
  .hn-prof-card { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 120px; }
  .hn-prof-foto { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(26,18,9,0.1); }
  .hn-prof-iniciais {
    width: 80px; height: 80px; border-radius: 50%;
    border: 1px solid rgba(26,18,9,0.2); background: #f5ede3;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 22px; color: #1a1209;
  }
  .hn-prof-nome { font-size: 15px; color: #1a1209; text-align: center; }

  /* Meus agendamentos */
  .hn-busca-wrap {
    display: flex; flex-direction: column; gap: 16px;
    max-width: 360px; margin: 0 auto; padding: 8px 0;
  }
  .hn-busca-desc { font-size: 15px; color: rgba(26,18,9,0.55); line-height: 1.6; text-align: center; }
  .hn-busca-input {
    width: 100%; padding: 14px 18px;
    border: 1px solid rgba(26,18,9,0.25); background: #fdf9f4;
    font-family: 'Cormorant Garamond', serif; font-size: 22px;
    color: #1a1209; outline: none; text-align: center; letter-spacing: 2px;
    transition: border-color 0.2s;
  }
  .hn-busca-input:focus { border-color: #1a1209; }
  .hn-busca-input::placeholder { color: rgba(26,18,9,0.3); font-style: italic; letter-spacing: 1px; font-size: 18px; }
  .hn-busca-btn {
    width: 100%; padding: 14px; background: #1a1209; border: none;
    color: #f5ede3; font-family: 'Playfair Display', serif;
    font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase;
    cursor: pointer; transition: background 0.2s; border-radius: 2px;
  }
  .hn-busca-btn:hover:not(:disabled) { background: #2e2010; }
  .hn-busca-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .hn-vazio { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; text-align: center; }
  .hn-vazio-ico { font-size: 40px; }
  .hn-vazio p { font-size: 15px; color: rgba(26,18,9,0.5); }

  .hn-ags-lista { display: flex; flex-direction: column; gap: 12px; }
  .hn-ags-count { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,18,9,0.4); margin-bottom: 4px; }
  .hn-ag-card { border: 1px solid rgba(26,18,9,0.12); padding: 16px 18px; background: #fdf9f4; border-radius: 2px; }
  .hn-ag-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .hn-ag-servico { font-family: 'Playfair Display', serif; font-size: 17px; color: #1a1209; }
  .hn-ag-status { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; padding: 3px 10px; border-radius: 2px; }
  .hn-ag-status-agendado   { background: rgba(122,89,32,0.12); color: #7a5920; }
  .hn-ag-status-confirmado { background: rgba(34,197,94,0.12);  color: #16a34a; }
  .hn-ag-info { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: rgba(26,18,9,0.65); }

  .hn-voltar-link {
    background: none; border: none; color: rgba(26,18,9,0.4);
    font-family: 'Cormorant Garamond', serif; font-size: 14px;
    cursor: pointer; padding: 8px 0 0; letter-spacing: 1px; transition: color 0.15s;
  }
  .hn-voltar-link:hover { color: #1a1209; }

  @media (max-width: 560px) {
    .hn-info-grid { grid-template-columns: 1fr; gap: 24px; }
    .hn-servicos-grid { grid-template-columns: 1fr; }
    .hn-titulo { font-size: 24px; letter-spacing: 5px; }
    .hn-tab-body { padding: 20px 16px; }
    .hn-modal { max-height: 92vh; }
  }
`;
