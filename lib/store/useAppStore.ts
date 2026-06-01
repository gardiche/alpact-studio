"use client";

import { create } from "zustand";
import type { User, Notification } from "@/types";

interface AppState {
  user: User | null;
  notifications: Notification[];
  unreadCount: number;
  copilotOpen: boolean;
  notificationsOpen: boolean;

  setUser: (user: User | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  toggleCopilot: () => void;
  closeCopilot: () => void;
  toggleNotifications: () => void;
  closeNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  notifications: [],
  unreadCount: 0,
  copilotOpen: false,
  notificationsOpen: false,

  setUser: (user) => set({ user }),

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  markNotificationRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  markAllRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications, unreadCount: 0 });
  },

  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen, notificationsOpen: false })),
  closeCopilot: () => set({ copilotOpen: false }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen, copilotOpen: false })),
  closeNotifications: () => set({ notificationsOpen: false }),
}));
