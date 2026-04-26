"use client";

import { useEffect, useState } from "react";

function getSalut() {
  return new Date().getHours() >= 18 ? "Bonsoir," : "Bonjour,";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HubHeader() {
  const [firstName, setFirstName] = useState("vous");

  useEffect(() => {
    // Lit le nom saisi sur la page login
    const entries = ["elyse_user", "gyna_user", "alpact_user"];
    for (const key of entries) {
      const val = localStorage.getItem(key);
      if (val) { setFirstName(val.split(" ")[0]); break; }
    }
  }, []);

  return (
    <div className="mb-8">
      <h1 className="font-serif text-5xl text-fg" style={{ fontFamily: 'DM Serif Display', fontSize: 48, lineHeight: 1.1 }}>
        {getSalut()} <span style={{ position: 'relative', display: 'inline-block' }}>
          {firstName}.
          <img src="/s1.svg" alt="" style={{ position: 'absolute', left: 0, bottom: -14, width: '140%' }} />
        </span>
      </h1>
      <div style={{ marginBottom: 8, marginTop: 20 }} />
      <p className="font-sans text-sm text-muted capitalize">
        {getFormattedDate()}
      </p>
    </div>
  );
}
