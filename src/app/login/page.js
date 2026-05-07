"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErro("Email ou senha incorretos");
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const { data: recep } = await supabase
      .from("recepcionistas")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (recep) {
      router.push("/recepcao");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          min-height: 100vh;
          background: #f5ede3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          padding: 24px 16px;
        }

        .card {
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(26,18,9,0.15);
          padding: 48px 40px;
          animation: fadeUp 0.6s ease forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-10px); }
          30%  { transform: translateX(10px); }
          45%  { transform: translateX(-8px); }
          60%  { transform: translateX(8px); }
          75%  { transform: translateX(-4px); }
          90%  { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        .card.shake {
          animation: shake 0.55s ease forwards;
          border-color: rgba(192,57,43,0.5);
        }

        /* Logo */
        .login-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 36px;
          gap: 12px;
        }

        .login-logo {
          height: 100px;
          width: auto;
          object-fit: contain;
        }

        .login-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(26,18,9,0.2), transparent);
        }

        .login-brand {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          letter-spacing: 6px;
          color: #1a1209;
          text-transform: uppercase;
        }

        .login-brand span { color: #7a5920; }

        .login-sub {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          letter-spacing: 3px;
          color: rgba(26,18,9,0.45);
        }

        /* Label de acesso */
        .login-acesso {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.4);
          text-align: center;
          margin-bottom: 28px;
        }

        /* Campos */
        .field {
          margin-bottom: 18px;
        }

        .field label {
          display: block;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(26,18,9,0.5);
          margin-bottom: 8px;
        }

        .field input {
          width: 100%;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(26,18,9,0.2);
          color: #1a1209;
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .field input:focus {
          border-color: #1a1209;
        }

        .field input::placeholder {
          color: rgba(26,18,9,0.25);
          font-style: italic;
        }

        .erro {
          color: #c0392b;
          font-size: 12px;
          letter-spacing: 1px;
          margin-bottom: 14px;
          text-align: center;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: #1a1209;
          border: none;
          cursor: pointer;
          font-family: 'Playfair Display', serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #f5ede3;
          transition: background 0.2s;
          margin-top: 8px;
        }

        .btn:hover:not(:disabled) { background: #2e2010; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .footer-line {
          text-align: center;
          margin-top: 28px;
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(26,18,9,0.25);
          text-transform: uppercase;
        }

        @media (max-width: 440px) {
          .card { padding: 36px 24px; }
          .login-logo { height: 80px; }
          .login-brand { font-size: 18px; letter-spacing: 4px; }
        }
      `}</style>

      <div className="login-root">
        <div className={`card ${shake ? "shake" : ""}`}>

          {/* Logo + nome */}
          <div className="login-logo-wrap">
            <img
              src="/logo.png"
              alt="Dom Navalha"
              className="login-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="login-divider" />
            <div className="login-brand">Dom <span>Navalha</span></div>
            <div className="login-sub">Barber Club</div>
          </div>

          <p className="login-acesso">Acesso restrito</p>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>

          {erro && <p className="erro">{erro}</p>}

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <p className="footer-line">Dom Navalha © 2025</p>
        </div>
      </div>
    </>
  );
}
