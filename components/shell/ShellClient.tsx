"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Sidebar } from "./Sidebar";
import { CopilotSidebar } from "@/components/copilot/CopilotSidebar";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { WelcomeAnimation } from "./WelcomeAnimation";
import type { User, Notification } from "@/types";

interface ShellClientProps {
  user: User;
  notifications: Notification[];
  children: React.ReactNode;
}

export function ShellClient({ user, notifications, children }: ShellClientProps) {
  const { setUser, setNotifications, copilotOpen } = useAppStore();
  const [animDone, setAnimDone] = useState(false);
  const [showAnim, setShowAnim] = useState(false);

  useEffect(() => {
    setUser(user);
    setNotifications(notifications);

    const key = `welcome_shown_${user.id}`;
    const shown = localStorage.getItem(key);
    if (!shown) {
      setShowAnim(true);
    } else {
      setAnimDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnimComplete() {
    setAnimDone(true);
    setShowAnim(false);
  }

  return (
    <>
      {showAnim && !animDone && (
        <WelcomeAnimation
          userId={user.id}
          firstName={user.first_name || "vous"}
          onComplete={handleAnimComplete}
        />
      )}

      <div
        className={`
          flex h-screen overflow-hidden bg-bg
          transition-opacity duration-500
          ${animDone ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* Sidebar gauche */}
        <Sidebar />

        {/* Zone de contenu principale */}
        <main
          className={`
            flex-1 overflow-y-auto bg-bg
            transition-all duration-300
            ${copilotOpen ? "mr-[380px]" : ""}
          `}
        >
          {children}
        </main>

        {/* Co-pilote IA */}
        <CopilotSidebar />

        {/* Panneau notifications */}
        <NotificationsPanel />
      </div>
    </>
  );
}
