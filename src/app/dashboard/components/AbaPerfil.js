"use client";

export default function AbaPerfil({ barbeiro, onLogout }) {
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

  return (
    <>
      <style>{`
        .perfil-container { max-width: 480px; }

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
          margin-bottom: 28px;
          background: rgba(255,255,255,0.4);
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
        <div className="perfil-avatar">{iniciais}</div>
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
