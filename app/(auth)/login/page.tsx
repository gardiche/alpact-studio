"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

export default function LoginPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prenom.trim() || !nom.trim()) { setError(true); return; }
    localStorage.setItem("alpact_user", `${prenom.trim()} ${nom.trim()}`);
    window.location.href = "/hub";
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{
        backgroundImage: "url('/background as.png')",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundRepeat: "no-repeat",
      }}
    >


      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <img
          src="/logo alpact studio.svg"
          alt="Alpact Studio"
          className="h-24 w-auto mx-auto mb-10"
        />

        {/* Titre */}
        <h1 className="font-serif text-3xl text-fg mb-2">Bienvenue</h1>
        <p className="font-sans text-sm text-muted mb-10">
          Entrez votre nom pour accéder à votre démo personnalisée.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Prénom"
              value={prenom}
              onChange={(e) => { setPrenom(e.target.value); setError(false); }}
              onKeyDown={handleKey}
              className="flex-1 px-4 py-3 rounded-xl font-sans text-sm text-fg bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
              style={{ border: `1.5px solid ${error && !prenom.trim() ? "#ff4f3f" : "#E4E0DB"}` }}
            />
            <input
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={(e) => { setNom(e.target.value); setError(false); }}
              onKeyDown={handleKey}
              className="flex-1 px-4 py-3 rounded-xl font-sans text-sm text-fg bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
              style={{ border: `1.5px solid ${error && !nom.trim() ? "#ff4f3f" : "#E4E0DB"}` }}
            />
          </div>

          {error && (
            <p className="font-sans text-xs text-left" style={{ color: "#ff4f3f" }}>
              Merci de renseigner prénom et nom.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-sans text-sm font-semibold text-white transition-all"
            style={{ background: "#111" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#111")}
          >
            Accéder à la démo →
          </button>
        </form>
      </div>
    </div>
  );
}
