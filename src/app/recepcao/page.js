"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import RecHoje from "./components/RecHoje";
import RecNovoAgendamento from "./components/RecNovoAgendamento";
import RecAgenda from "./components/RecAgenda";
import RecBloqueios from "./components/RecBloqueios";
import RecGerenciar from "./components/RecGerenciar";

export default function RecepcaoPage() {
  const [recepcionista, setRecepcionista] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("hoje");
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: recep, error: errRecep } = await supabase
        .from("recepcionistas")
        .select("*")
        .eq("email", user.email.toLowerCase().trim())
        .single();

      console.log("[recepcao] user.email:", user.email);
      console.log("[recepcao] recep:", recep, "erro:", errRecep);

      if (!recep) {
        // Não é recepcionista — tenta dashboard
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }
      setRecepcionista(recep);

      const { data: barbs, error: errBarbs } = await supabase
        .from("barbeiros")
        .select("*")
        .order("nome");

      console.log("[recepcao] barbeiros:", barbs, "erro:", errBarbs);

      setBarbeiros(barbs || []);
    }
    carregar();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!recepcionista)
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#b48c3c", fontFamily: "serif", letterSpacing: 3,
      }}>
        CARREGANDO...
      </div>
    );

  const abas = [
    { id: "hoje", label: "Hoje", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id: "novo", label: "Novo", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { id: "agenda", label: "Agenda", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: "bloqueios", label: "Bloqueios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { id: "gerenciar", label: "Gerenciar", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .dash-root { min-height: 100vh; background: #f5ede3; color: #1a1209; font-family: 'Cormorant Garamond', serif; display: flex; flex-direction: column; }

        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 32px; border-bottom: 1px solid rgba(26,18,9,0.12); background: rgba(245,237,227,0.97); position: sticky; top: 0; z-index: 100; }
        .topbar-logo { height: 72px; width: auto; object-fit: contain; display: block; }
        .topbar-brand-text { font-family: 'Playfair Display', serif; font-size: 22px; letter-spacing: 5px; color: #1a1209; text-transform: uppercase; }
        .topbar-brand-text span { color: #7a5920; }
        .topbar-user { display: flex; align-items: center; gap: 16px; }
        .topbar-badge { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; background: #1a1209; color: #f5ede3; padding: 3px 8px; }
        .topbar-nome { font-size: 14px; letter-spacing: 2px; color: #1a1209; }
        .btn-sair { background: none; border: 1px solid rgba(26,18,9,0.4); color: #1a1209; padding: 6px 16px; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; transition: all 0.2s; white-space: nowrap; }
        .btn-sair:hover { background: rgba(26,18,9,0.08); }

        .navbar { display: flex; border-bottom: 2px solid rgba(26,18,9,0.15); padding: 0 32px; background: #e8d9cb; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .navbar::-webkit-scrollbar { display: none; }
        .nav-item { display: flex; align-items: center; gap: 7px; padding: 14px 22px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(26,18,9,0.5); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'Cormorant Garamond', serif; white-space: nowrap; flex-shrink: 0; }
        .nav-item:hover { color: #1a1209; }
        .nav-item.ativo { color: #1a1209; border-bottom-color: #1a1209; font-weight: 600; }

        .barbeiro-selector { background: #e0d0c0; border-bottom: 1px solid rgba(26,18,9,0.1); padding: 10px 32px; display: flex; align-items: center; gap: 12px; }
        .barbeiro-selector-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,18,9,0.5); }
        .barbeiro-selector-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .barbeiro-btn { padding: 6px 18px; border: 1px solid rgba(26,18,9,0.2); background: none; font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 1px; color: rgba(26,18,9,0.6); cursor: pointer; transition: all 0.15s; }
        .barbeiro-btn:hover { border-color: rgba(26,18,9,0.4); color: #1a1209; }
        .barbeiro-btn.ativo { background: #1a1209; border-color: #1a1209; color: #f5ede3; }

        .content { flex: 1; padding: 40px 32px; max-width: 900px; width: 100%; margin: 0 auto; }

        .page-title { font-family: 'Playfair Display', serif; font-size: 28px; color: #1a1209; margin-bottom: 8px; }
        .page-subtitle { font-size: 13px; letter-spacing: 2px; color: #1a1209; text-transform: uppercase; margin-bottom: 32px; }
        .divider { height: 1px; background: linear-gradient(to right, rgba(26,18,9,0.3), transparent); margin-bottom: 32px; }

        .card-agendamento { border: 1px solid rgba(26,18,9,0.2); background: rgba(255,255,255,0.6); padding: 20px 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 24px; transition: border-color 0.2s; }
        .card-agendamento:hover { border-color: rgba(26,18,9,0.4); }
        .hora { font-family: 'Playfair Display', serif; font-size: 22px; color: #1a1209; min-width: 70px; }
        .ag-info { flex: 1; }
        .ag-nome { font-size: 18px; color: #1a1209; margin-bottom: 4px; }
        .ag-servico { font-size: 13px; letter-spacing: 1px; color: #1a1209; text-transform: uppercase; }
        .ag-status { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; border: 1px solid; }
        .status-agendado { color: #7a5920; border-color: rgba(122,89,32,0.5); }
        .status-confirmado { color: #2e7d32; border-color: rgba(46,125,50,0.5); }
        .status-cancelado { color: #c0392b; border-color: rgba(192,57,43,0.5); }
        .empty-state { text-align: center; padding: 60px 0; color: rgba(26,18,9,0.45); font-size: 15px; letter-spacing: 2px; text-transform: uppercase; }

        @media (max-width: 600px) {
          .topbar { padding: 10px 16px; }
          .topbar-logo { height: 44px; }
          .topbar-brand-text { font-size: 15px; letter-spacing: 3px; }
          .topbar-nome { display: none; }
          .navbar { padding: 0 8px; }
          .nav-item { padding: 12px 14px; font-size: 10px; letter-spacing: 1.5px; gap: 5px; }
          .content { padding: 24px 16px; }
          .barbeiro-selector { padding: 10px 16px; }
          .card-agendamento { padding: 14px 16px; gap: 14px; }
          .hora { font-size: 18px; min-width: 54px; }
          .ag-nome { font-size: 15px; }
          .ag-status { font-size: 10px; padding: 3px 8px; }
        }
      `}</style>

      <div className="dash-root">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img src="/logo.png" alt="Dom Navalha" className="topbar-logo"
              onError={(e) => { e.target.style.display = "none"; }} />
            <div className="topbar-brand-text">Dom <span>Navalha</span></div>
          </div>
          <div className="topbar-user">
            <span className="topbar-badge">Recepção</span>
            <span className="topbar-nome">{recepcionista.nome}</span>
            <button className="btn-sair" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        <nav className="navbar">
          {abas.map((aba) => (
            <button
              key={aba.id}
              className={`nav-item ${abaAtiva === aba.id ? "ativo" : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.icon}
              {aba.label}
            </button>
          ))}
        </nav>

        <main className="content">
          {abaAtiva === "hoje" && <RecHoje barbeiros={barbeiros} />}
          {abaAtiva === "novo" && <RecNovoAgendamento barbeiros={barbeiros} />}
          {abaAtiva === "agenda" && <RecAgenda barbeiros={barbeiros} />}
          {abaAtiva === "bloqueios" && <RecBloqueios barbeiros={barbeiros} />}
          {abaAtiva === "gerenciar" && <RecGerenciar barbeiros={barbeiros} />}
        </main>
      </div>
    </>
  );
}
