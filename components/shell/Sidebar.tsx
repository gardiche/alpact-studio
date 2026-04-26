"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  LayoutDashboard,
  Zap,
  TrendingUp,
  Target,
  Bell,
  MessageSquare,
  LogOut,
  Settings,
  User,
  ChevronUp,
} from "lucide-react";

const navItems = [
  { href: "/hub",    label: "Hub",    icon: LayoutDashboard, color: "#2D5BE3", logo: "/dashboard/hub.svg" },
  { href: "/astryd", label: "Astryd", icon: Zap,             color: "#ff8f27", logo: "/dashboard/astryd.svg" },
  { href: "/elyse",  label: "Elyse",  icon: TrendingUp,      color: "#1cb785", logo: "/dashboard/elyse.svg" },
  { href: "/gyna",   label: "Gyna",   icon: Target,          color: "#9d89fc", logo: "/dashboard/gyna.svg" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, unreadCount, toggleCopilot, toggleNotifications, copilotOpen } = useAppStore();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-[240px] flex-shrink-0 h-screen bg-surface border-r border-border flex flex-col sticky top-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/hub" className="hover:opacity-80 transition-opacity">
          <img src="/logo alpact studio.svg" alt="Alpact Studio" className="h-24 w-auto" />
        </Link>
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
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
              {item.logo ? (
                <img src={item.logo} alt={item.label} className="h-6 w-auto object-contain flex-shrink-0" />
              ) : (
                <Icon size={20} style={{ color: active ? item.color : undefined }} />
              )}
              {item.label}
            </Link>
          );
        })}

        <div className="h-px bg-border my-2" />

        <Link
          href="/integrations"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            font-sans text-sm transition-all duration-150
            ${isActive("/integrations")
              ? "bg-bg text-fg font-semibold border-l-[3px] border-blue"
              : "text-muted hover:bg-bg hover:text-fg"
            }
          `}
          style={isActive("/integrations") ? { paddingLeft: "9px" } : {}}
        >
          <img src="/dashboard/integration.svg" alt="Intégrations" className="h-6 w-auto object-contain flex-shrink-0" />
          Intégrations
        </Link>
      </nav>

      {/* Actions bas de sidebar */}
      <div className="px-3 pb-3 space-y-1">
        <div className="h-px bg-border mb-2" />

        {/* Notifications */}
        <button
          onClick={toggleNotifications}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-muted hover:bg-bg hover:text-fg transition-all duration-150"
        >
          <div className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications</span>
        </button>

        {/* Co-pilote */}
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

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-fg hover:bg-bg transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-beige flex items-center justify-center flex-shrink-0">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-muted">
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <span className="flex-1 text-left truncate text-sm font-medium">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email || "Mon compte"}
            </span>
            <ChevronUp
              size={14}
              className={`text-muted transition-transform ${avatarMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {avatarMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-[20px] shadow-card overflow-hidden z-50">
              <Link
                href="/settings"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-fg hover:bg-bg transition-colors"
              >
                <User size={15} className="text-muted" />
                Profil
              </Link>
              <Link
                href="/settings"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-fg hover:bg-bg transition-colors"
              >
                <Settings size={15} className="text-muted" />
                Settings
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
