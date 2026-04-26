"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { User, Briefcase, Bell, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "profile" | "project" | "preferences" | "account";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Mon profil", icon: User },
  { id: "project", label: "Mon projet", icon: Briefcase },
  { id: "preferences", label: "Mes préférences", icon: Bell },
  { id: "account", label: "Mon compte", icon: Shield },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative w-10 h-6 rounded-full transition-colors duration-200
        ${checked ? "bg-blue" : "bg-border"}
      `}
    >
      <span
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    project_name: user?.project_name || "",
    project_description: user?.project_description || "",
    stage: user?.stage || "",
    sector: user?.sector || "",
    team_size: user?.team_size?.toString() || "",
    founded_at: user?.founded_at || "",
  });

  function debouncedSave(data: typeof form) {
    setSaving(true);
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser({ ...user!, ...data, team_size: data.team_size ? parseInt(data.team_size) : null } as any);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 300);
  }

  function handleChange(field: string, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => debouncedSave(next), 500);
  }

  function handleSignOut() {
    router.push("/login");
  }

  const inputClass = `
    w-full px-4 py-2.5 rounded-xl
    bg-bg border border-border
    font-sans text-sm text-fg
    placeholder:text-muted
    focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue
    transition-all duration-150
  `;

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-fg mb-1">Paramètres</h1>
            <p className="font-sans text-sm text-muted">Gérez votre profil et vos préférences.</p>
          </div>
          {saving && <span className="font-sans text-xs text-muted">Sauvegarde…</span>}
          {saved && !saving && <span className="font-sans text-xs text-green">Sauvegardé ✓</span>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface rounded-card p-1 shadow-card w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-[14px]
                font-sans text-sm transition-all duration-150
                ${activeTab === id
                  ? "bg-bg text-fg font-medium shadow-card"
                  : "text-muted hover:text-fg"
                }
              `}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Mon profil */}
        {activeTab === "profile" && (
          <div className="bg-surface rounded-card shadow-card p-6 space-y-4">
            <h2 className="font-sans font-semibold text-sm text-fg mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Prénom</label>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="Thomas"
                />
              </div>
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Nom</label>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Gardet"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mon projet */}
        {activeTab === "project" && (
          <div className="bg-surface rounded-card shadow-card p-6 space-y-4">
            <h2 className="font-sans font-semibold text-sm text-fg mb-4">Votre projet</h2>
            <div>
              <label className="block font-sans text-xs text-muted mb-1.5">Nom du projet</label>
              <input
                className={inputClass}
                value={form.project_name}
                onChange={(e) => handleChange("project_name", e.target.value)}
                placeholder="Alpact Studio"
              />
            </div>
            <div>
              <label className="block font-sans text-xs text-muted mb-1.5">Description courte</label>
              <textarea
                className={`${inputClass} resize-none`}
                value={form.project_description}
                onChange={(e) => handleChange("project_description", e.target.value)}
                placeholder="Décrivez votre projet en quelques mots…"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Stade</label>
                <select
                  className={inputClass}
                  value={form.stage}
                  onChange={(e) => handleChange("stage", e.target.value)}
                >
                  <option value="">Choisir un stade</option>
                  <option value="démarrage">Démarrage</option>
                  <option value="early-stage">Early-stage</option>
                  <option value="post-levée">Post-levée</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Secteur</label>
                <input
                  className={inputClass}
                  value={form.sector}
                  onChange={(e) => handleChange("sector", e.target.value)}
                  placeholder="SaaS, Fintech, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Taille de l&apos;équipe</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.team_size}
                  onChange={(e) => handleChange("team_size", e.target.value)}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block font-sans text-xs text-muted mb-1.5">Date de démarrage</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.founded_at}
                  onChange={(e) => handleChange("founded_at", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mes préférences */}
        {activeTab === "preferences" && (
          <div className="bg-surface rounded-card shadow-card p-6 space-y-4">
            <h2 className="font-sans font-semibold text-sm text-fg mb-4">Préférences</h2>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-sans text-sm text-fg">Notifications in-app</p>
                <p className="font-sans text-xs text-muted">Alertes et rappels dans l&apos;interface</p>
              </div>
              <Toggle checked={notifInApp} onChange={setNotifInApp} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-sans text-sm text-fg">Emails d&apos;alerte</p>
                <p className="font-sans text-xs text-muted">Recevez les alertes critiques par email</p>
              </div>
              <Toggle checked={notifEmail} onChange={setNotifEmail} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-sans text-sm text-fg">Langue</p>
                <p className="font-sans text-xs text-muted">Interface en français</p>
              </div>
              <span className="font-sans text-sm text-muted px-3 py-1 bg-bg rounded-full">Français</span>
            </div>
          </div>
        )}

        {/* Mon compte */}
        {activeTab === "account" && (
          <div className="bg-surface rounded-card shadow-card p-6 space-y-4">
            <h2 className="font-sans font-semibold text-sm text-fg mb-4">Mon compte</h2>
            <div className="py-3 border-b border-border">
              <label className="block font-sans text-xs text-muted mb-1.5">Email</label>
              <p className="font-sans text-sm text-muted">{user?.email}</p>
            </div>
            <div className="py-3 border-b border-border">
              <Button variant="ghost" onClick={handleSignOut} size="sm">
                Se déconnecter
              </Button>
            </div>
            <div className="py-3">
              <p className="font-sans text-xs font-semibold text-red mb-2">Zone dangereuse</p>
              <Button variant="danger" size="sm" disabled>
                Supprimer mon compte
              </Button>
              <p className="font-sans text-xs text-muted mt-2">
                La suppression de compte est désactivée en V1.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
