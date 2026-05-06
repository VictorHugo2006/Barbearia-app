"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AbaAgenda from "./components/AbaAgenda";
import AbaBloqueios from "./components/AbaBloqueios";
import AbaPerfil from "./components/AbaPerfil";
import AbaNovoAgendamento from "./components/AbaNovoAgendamento";

export default function DashboardPage() {
  const [barbeiro, setBarbeiro] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("hoje");
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("barbeiros")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) {
        // Não é barbeiro — redireciona para login
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setBarbeiro(data);

      if (data) {
        const hoje = new Date();
        const trintaMinAtras = new Date(hoje.getTime() - 30 * 60 * 1000);

        // Formata em horário local sem converter para UTC
        function toLocalStr(d) {
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:00`;
        }

        const inicio = toLocalStr(trintaMinAtras);
        const fim = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}T23:59:59`;

        const { data: agendamentos, error: errAg } = await supabase
          .from("agendamentos")
          .select("*")
          .eq("barbeiro", data.nome)
          .gte("data_hora", inicio)
          .lt("data_hora", fim)
          .order("data_hora", { ascending: true });

        console.log("[agenda] barbeiro:", data.nome);
        console.log("[agenda] range:", inicio, "→", fim);
        console.log("[agenda] result:", { agendamentos, errAg });

        setAgendamentosHoje(agendamentos || []);
      }
    }
    carregar();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!barbeiro)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b48c3c",
          fontFamily: "serif",
          letterSpacing: 3,
        }}
      >
        CARREGANDO...
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .dash-root {
          min-height: 100vh;
          background: #f5ede3;
          color: #1a1209;
          font-family: 'Cormorant Garamond', serif;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 32px;
          border-bottom: 1px solid rgba(26,18,9,0.12);
          background: rgba(245,237,227,0.97);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-logo {
          height: 72px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        .topbar-brand-text {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          letter-spacing: 5px;
          color: #1a1209;
          text-transform: uppercase;
        }

        .topbar-brand-text span {
          color: #7a5920;
        }

        .topbar-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .topbar-nome {
          font-size: 14px;
          letter-spacing: 2px;
          color: #1a1209;
        }

        .btn-sair {
          background: none;
          border: 1px solid rgba(26,18,9,0.4);
          color: #1a1209;
          padding: 6px 16px;
          cursor: pointer;
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-sair:hover {
          background: rgba(26,18,9,0.08);
        }

        .navbar {
          display: flex;
          border-bottom: 2px solid rgba(26,18,9,0.15);
          padding: 0 32px;
          background: #e8d9cb;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .navbar::-webkit-scrollbar { display: none; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 14px 22px;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.5);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: 'Cormorant Garamond', serif;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-item:hover { color: #1a1209; }

        .nav-item.ativo {
          color: #1a1209;
          border-bottom-color: #1a1209;
          font-weight: 600;
        }

        .nav-item svg { flex-shrink: 0; }

        .content {
          flex: 1;
          padding: 40px 32px;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
        }

        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #1a1209;
          margin-bottom: 8px;
        }

        .page-subtitle {
          font-size: 13px;
          letter-spacing: 2px;
          color: #1a1209;
          text-transform: uppercase;
          margin-bottom: 32px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, rgba(26,18,9,0.3), transparent);
          margin-bottom: 32px;
        }

        .card-agendamento {
          border: 1px solid rgba(26,18,9,0.2);
          background: rgba(255,255,255,0.6);
          padding: 20px 24px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 24px;
          transition: border-color 0.2s;
        }

        .card-agendamento:hover {
          border-color: rgba(26,18,9,0.4);
        }

        .hora {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #1a1209;
          min-width: 70px;
        }

        .ag-info { flex: 1; }

        .ag-nome {
          font-size: 18px;
          color: #1a1209;
          margin-bottom: 4px;
        }

        .ag-servico {
          font-size: 13px;
          letter-spacing: 1px;
          color: #1a1209;
          text-transform: uppercase;
        }

        .ag-status {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 4px 12px;
          border: 1px solid;
        }

        .status-agendado { color: #7a5920; border-color: rgba(122,89,32,0.5); }
        .status-confirmado { color: #2e7d32; border-color: rgba(46,125,50,0.5); }
        .status-cancelado { color: #c0392b; border-color: rgba(192,57,43,0.5); }

        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: rgba(26,18,9,0.45);
          font-size: 15px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .em-breve {
          text-align: center;
          padding: 80px 0;
          color: rgba(26,18,9,0.35);
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          letter-spacing: 4px;
        }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          .topbar {
            padding: 10px 16px;
          }

          .topbar-logo {
            height: 44px;
          }

          .topbar-brand-text {
            font-size: 15px;
            letter-spacing: 3px;
          }

          .topbar-nome {
            display: none;
          }

          .navbar {
            padding: 0 8px;
          }

          .nav-item {
            padding: 12px 14px;
            font-size: 10px;
            letter-spacing: 1.5px;
            gap: 5px;
          }

          .content {
            padding: 24px 16px;
          }

          .page-title {
            font-size: 22px;
          }

          .page-subtitle {
            font-size: 11px;
            letter-spacing: 1.5px;
            margin-bottom: 20px;
          }

          .card-agendamento {
            padding: 14px 16px;
            gap: 14px;
          }

          .hora {
            font-size: 18px;
            min-width: 54px;
          }

          .ag-nome {
            font-size: 15px;
          }

          .ag-servico {
            font-size: 11px;
          }

          .ag-status {
            font-size: 10px;
            letter-spacing: 1px;
            padding: 3px 8px;
          }
        }
      `}</style>

      <div className="dash-root">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img
              src="/logo.png"
              alt="Dom Navalha"
              className="topbar-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="topbar-brand-text">
              Dom <span>Navalha</span>
            </div>
          </div>
          <div className="topbar-user">
            <span className="topbar-nome">{barbeiro.nome}</span>
            <button className="btn-sair" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <nav className="navbar">
          <button className={`nav-item ${abaAtiva === "hoje" ? "ativo" : ""}`} onClick={() => setAbaAtiva("hoje")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Hoje
          </button>
          <button className={`nav-item ${abaAtiva === "agenda" ? "ativo" : ""}`} onClick={() => setAbaAtiva("agenda")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Agenda
          </button>
          <button className={`nav-item ${abaAtiva === "bloqueios" ? "ativo" : ""}`} onClick={() => setAbaAtiva("bloqueios")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Bloqueios
          </button>
          <button className={`nav-item ${abaAtiva === "novo" ? "ativo" : ""}`} onClick={() => setAbaAtiva("novo")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Novo
          </button>
          <button className={`nav-item ${abaAtiva === "perfil" ? "ativo" : ""}`} onClick={() => setAbaAtiva("perfil")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Perfil
          </button>
        </nav>

        <main className="content">
          {abaAtiva === "hoje" && (
            <>
              <h1 className="page-title">Agenda de Hoje</h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <div className="divider" />
              {agendamentosHoje.length === 0 ? (
                <div className="empty-state">Nenhum agendamento para hoje</div>
              ) : (
                agendamentosHoje.map((ag) => (
                  <div key={ag.id} className="card-agendamento">
                    <div className="hora">
                      {new Date(ag.data_hora).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="ag-info">
                      <div className="ag-nome">{ag.nome_cliente}</div>
                      <div className="ag-servico">{ag.servico}</div>
                    </div>
                    <div className={`ag-status status-${ag.status}`}>
                      {ag.status}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {abaAtiva === "agenda" && <AbaAgenda barbeiro={barbeiro} />}

          {abaAtiva === "bloqueios" && <AbaBloqueios barbeiro={barbeiro} />}

          {abaAtiva === "novo" && <AbaNovoAgendamento barbeiro={barbeiro} />}

          {abaAtiva === "perfil" && (
            <AbaPerfil barbeiro={barbeiro} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </>
  );
}
