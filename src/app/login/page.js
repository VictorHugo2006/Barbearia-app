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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErro("Email ou senha incorretos");
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    // Verifica se é recepcionista
    const { data: recep } = await supabase
      .from("recepcionistas")
      .select("id")
      .eq("email", email)
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
          background-color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Cormorant Garamond', serif;
        }

        .bg-texture {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(ellipse at 20% 50%, rgba(180, 140, 60, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(180, 140, 60, 0.04) 0%, transparent 50%);
        }

        .bg-lines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 60px,
            rgba(180, 140, 60, 0.03) 60px,
            rgba(180, 140, 60, 0.03) 61px
          );
        }

        .card {
          position: relative;
          z-index: 10;
          width: 420px;
          padding: 56px 48px;
          border: 1px solid rgba(180, 140, 60, 0.25);
          background: rgba(15, 13, 10, 0.95);
          box-shadow: 0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,140,60,0.1);
          animation: fadeUp 0.8s ease forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
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
          border-color: rgba(192, 57, 43, 0.7);
          box-shadow: 0 0 80px rgba(0,0,0,0.8), 0 0 24px rgba(192,57,43,0.2), inset 0 1px 0 rgba(192,57,43,0.15);
        }

        .corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: #b48c3c;
          border-style: solid;
        }
        .corner-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .corner-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .corner-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .corner-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        .logo-area {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .logo-divider::before,
        .logo-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(180,140,60,0.5));
        }

        .logo-divider::after {
          background: linear-gradient(to left, transparent, rgba(180,140,60,0.5));
        }

        .logo-diamond {
          width: 6px;
          height: 6px;
          background: #b48c3c;
          transform: rotate(45deg);
        }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #f0e6cc;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .brand-sub {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 14px;
          color: #b48c3c;
          letter-spacing: 3px;
          margin-top: 4px;
        }

        .section-label {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(180,140,60,0.6);
          margin-bottom: 24px;
          text-align: center;
        }

        .field {
          margin-bottom: 20px;
        }

        .field label {
          display: block;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(180,140,60,0.7);
          margin-bottom: 8px;
        }

        .field input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(180,140,60,0.2);
          color: #f0e6cc;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.3s, background 0.3s;
        }

        .field input:focus {
          border-color: rgba(180,140,60,0.6);
          background: rgba(180,140,60,0.05);
        }

        .field input::placeholder {
          color: rgba(240,230,204,0.2);
          font-style: italic;
        }

        .erro {
          color: #c0392b;
          font-size: 13px;
          letter-spacing: 1px;
          margin-bottom: 16px;
          text-align: center;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #b48c3c, #d4aa5a, #b48c3c);
          background-size: 200% 100%;
          border: none;
          cursor: pointer;
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #0a0a0a;
          transition: background-position 0.4s, opacity 0.2s;
          margin-top: 8px;
        }

        .btn:hover:not(:disabled) {
          background-position: 100% 0;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .footer-line {
          text-align: center;
          margin-top: 32px;
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(180,140,60,0.3);
          text-transform: uppercase;
        }
      `}</style>

      <div className="login-root">
        <div className="bg-texture" />
        <div className="bg-lines" />

        <div className={`card ${shake ? "shake" : ""}`}>
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />

          <div className="logo-area">
            <div className="logo-divider">
              <div className="logo-diamond" />
            </div>
            <div className="brand-name">Dom Navalha</div>
            <div className="brand-sub">Barber Club</div>
            <div
              className="logo-divider"
              style={{ marginTop: 20, marginBottom: 0 }}
            >
              <div className="logo-diamond" />
            </div>
          </div>

          <p className="section-label">Acesso restrito</p>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
