"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { X, Bell, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import type { Notification } from "@/types";

const typeIcons = {
  warning: AlertTriangle,
  critique: AlertCircle,
  rappel: Clock,
};

const typeColors = {
  warning: "text-orange",
  critique: "text-red",
  rappel: "text-blue",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  if (mins > 0) return `il y a ${mins}min`;
  return "à l'instant";
}

export function NotificationsPanel() {
  const { notifications, notificationsOpen, closeNotifications, markNotificationRead, markAllRead } = useAppStore();
  const supabase = createClient();

  if (!notificationsOpen) return null;

  async function handleMarkRead(notif: Notification) {
    if (notif.is_read) return;
    markNotificationRead(notif.id);
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
  }

  async function handleMarkAllRead() {
    markAllRead();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    }
  }

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={closeNotifications}
      />
      <div className="fixed left-[240px] top-0 h-screen w-80 bg-surface border-r border-border z-50 flex flex-col shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-fg" />
            <span className="font-sans font-semibold text-sm text-fg">Notifications</span>
            {unread.length > 0 && (
              <span className="bg-red text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
                {unread.length}
              </span>
            )}
          </div>
          <button onClick={closeNotifications} className="text-muted hover:text-fg transition-colors">
            <X size={16} />
          </button>
        </div>

        {unread.length > 0 && (
          <div className="px-5 py-2 border-b border-border">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-sans text-blue hover:underline"
            >
              Tout marquer comme lu
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bell size={32} className="text-border mb-3" />
              <p className="font-sans text-sm text-muted">Aucune notification pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                const color = typeColors[notif.type] || "text-muted";
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleMarkRead(notif)}
                    className={`
                      w-full text-left px-5 py-4 hover:bg-bg transition-colors
                      ${!notif.is_read ? "bg-blue/5" : ""}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={15} className={`${color} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-sans text-sm text-fg ${!notif.is_read ? "font-medium" : ""}`}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="font-sans text-xs text-muted mt-0.5 line-clamp-2">{notif.message as string}</p>
                        )}
                        <p className="font-sans text-xs text-muted mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
