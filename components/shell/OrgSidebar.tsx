"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  Users,
  TrendingUp,
  Activity,
  MessageSquare,
  ChevronUp,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useOrgStore } from "@/lib/store/useOrgStore";

const navItems = [
  { href: "/org", label: "Ma cohorte", icon: Users, color: "#2D5BE3" },
  { href: "/org/tendances", label: "Tendances", icon: Activity, color: "#ff8f27" },
  { href: "/org/impact", label: "Impact", icon: TrendingUp, color: "#1cb785" },
];

export function OrgSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { org, member, toggleCopilot, copilotOpen } = useOrgStore();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/org") return pathname === "/org";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // "Ma cohorte" reste actif sur /org, et sur les vues détail /org/[id]/...
  // mais PAS sur /org/tendances ou /org/impact (qui ont leurs propres entrées).
  function isCohorteContext() {
    if (pathname === "/org") return true;
    if (pathname.startsWith("/org/tendances")) return false;
    if (pathname.startsWith("/org/impact")) return false;
    return /^\/org\/[^/]+/.test(pathname);
  }

  return (
    <aside className="w-[240px] flex-shrink-0 h-screen bg-surface border-r border-border flex flex-col sticky top-0">
      {/* Logo + Org */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/org" className="hover:opacity-80 transition-opacity block">
          <img src="/logo alpact studio.svg" alt="Alpact Studio" className="h-16 w-auto" />
        </Link>
        {org && (
          <div className="mt-3 px-1">
            <div className="font-serif text-lg text-fg leading-tight">{org.name}</div>
            <div className="font-sans text-[11px] text-muted capitalize mt-0.5">
              {org.city ?? org.type}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Nav principale */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/org" ? isCohorteContext() : isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                font-sans text-sm transition-all duration-150
                ${active
                  ? "bg-bg text-fg font-semibold"
                  : "text-muted hover:bg-bg hover:text-fg"
                }
              `}
              style={active ? { borderLeft: `3px solid ${item.color}`, paddingLeft: "9px" } : {}}
            >
              <Icon size={18} style={{ color: active ? item.color : undefined }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 space-y-1">
        <div className="h-px bg-border mb-2" />

        <button
          onClick={toggleCopilot}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            font-sans text-sm transition-all duration-150
            ${copilotOpen ? "bg-bg text-fg font-semibold" : "text-muted hover:bg-bg hover:text-fg"}
          `}
        >
          <MessageSquare size={18} style={{ color: copilotOpen ? "#2D5BE3" : undefined }} />
          Co-pilote IA
        </button>

        <div className="h-px bg-border my-2" />

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-fg hover:bg-bg transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-beige flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-muted">
                {member?.first_name?.[0] ?? "?"}
              </span>
            </div>
            <span className="flex-1 text-left truncate text-sm font-medium">
              {member ? `${member.first_name} ${member.last_name}` : "Mon compte"}
            </span>
            <ChevronUp
              size={14}
              className={`text-muted transition-transform ${avatarMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {avatarMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-[20px] shadow-card overflow-hidden z-50">
              <Link
                href="#"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-fg hover:bg-bg transition-colors"
              >
                <User size={15} className="text-muted" />
                Profil structure
              </Link>
              <Link
                href="#"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-fg hover:bg-bg transition-colors"
              >
                <Settings size={15} className="text-muted" />
                Paramètres
              </Link>
              <div className="h-px bg-border mx-3" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-red hover:bg-red/5 transition-colors"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
