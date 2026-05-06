"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AbaPerfil({ barbeiro, onLogout }) {
  const [fotoUrl, setFotoUrl] = useState(barbeiro.foto_url || null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef(null);

  const iniciais = barbeiro.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dataCadastro = new Date(barbeiro.created_at).toLocaleDateString(
    "pt-BR",
    { day: "numeric", month: "long", year: "numeric" }
  );

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnviando(true);

    const ext = file.name.split(".").pop();
    const path = `${barbeiro.id}.${ext}`;

    // Faz upload para o bucket "avatars"
    const { error: errUpload } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (errUpload) {
      alert("Erro ao enviar foto: " + errUpload.message);
      setEnviando(false);
      return;
    }

    // Pega a URL pública
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const novaUrl = urlData.publicUrl + "?t=" + Date.now();

    // Salva a URL no banco
    await supabase
      .from("barbeiros")
      .update({ foto_url: urlData.publicUrl })
      .eq("id", barbeiro.id);

    setFotoUrl(novaUrl);
    setEnviando(false);
  }

  return (
    <>
      <style>{`
        .perfil-container { max-width: 480px; }

        .perfil-avatar-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 28px;
          cursor: pointer;
        }

        .perfil-avatar {
          width: 80px;
          height: 80px;
          border: 1px solid rgba(26,18,9,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #1a1209;
          background: rgba(255,255,255,0.4);
          overflow: hidden;
        }

        .perfil-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .perfil-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(26,18,9,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .perfil-avatar-wrap:hover .perfil-avatar-overlay {
          opacity: 1;
        }

        .perfil-avatar-overlay svg {
          color: #f5ede3;
        }

        .perfil-avatar-enviando {
          position: absolute;
          inset: 0;
          background: rgba(26,18,9,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          letter-spacing: 1px;
          color: #f5ede3;
          text-transform: uppercase;
        }

        .perfil-avatar-dica {
          font-size: 10px;
          letter-spacing: 1px;
          color: rgba(26,18,9,0.4);
          text-transform: uppercase;
          margin-top: -20px;
          margin-bottom: 28px;
        }

        .perfil-nome {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #1a1209;
          margin-bottom: 4px;
        }

        .perfil-cargo {
          font-size: 11px;
          letter-spacing: 3px;
          color: #1a1209;
          text-transform: uppercase;
          margin-bottom: 36px;
        }

        .perfil-fields {
          border: 1px solid rgba(26,18,9,0.15);
          background: rgba(255,255,255,0.4);
          margin-bottom: 32px;
        }

        .perfil-field {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(26,18,9,0.1);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .perfil-field:last-child { border-bottom: none; }

        .perfil-field-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #1a1209;
        }

        .perfil-field-value {
          font-size: 16px;
          color: #1a1209;
        }

        .btn-logout {
          background: none;
          border: 1px solid rgba(192,57,43,0.5);
          color: #c0392b;
          padding: 12px 28px;
          cursor: pointer;
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: rgba(192,57,43,0.08);
          border-color: #c0392b;
        }
      `}</style>

      <h1 className="page-title">Perfil</h1>
      <p className="page-subtitle">Suas informações</p>
      <div className="divider" />

      <div className="perfil-container">

        {/* Avatar clicável */}
        <div className="perfil-avatar-wrap" onClick={() => inputRef.current?.click()}>
          <div className="perfil-avatar">
            {fotoUrl
              ? <img src={fotoUrl} alt={barbeiro.nome} />
              : iniciais
            }
          </div>

          {enviando ? (
            <div className="perfil-avatar-enviando">...</div>
          ) : (
            <div className="perfil-avatar-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
          )}
        </div>

        <p className="perfil-avatar-dica">Clique para trocar a foto</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFoto}
        />

        <div className="perfil-nome">{barbeiro.nome}</div>
        <div className="perfil-cargo">Barbeiro — Dom Navalha</div>

        <div className="perfil-fields">
          <div className="perfil-field">
            <span className="perfil-field-label">Email</span>
            <span className="perfil-field-value">{barbeiro.email}</span>
          </div>
          <div className="perfil-field">
            <span className="perfil-field-label">Membro desde</span>
            <span className="perfil-field-value">{dataCadastro}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={onLogout}>
          Encerrar sessão
        </button>
      </div>
    </>
  );
}
