// Identification de l'utilisateur côté serveur pour les routes intégrations.
// Utilise la vraie auth Supabase (session cookie).

import { createClient } from "@/lib/supabase/server";

/**
 * Retourne l'ID de l'utilisateur authentifié.
 * Throw si pas de session — les routes doivent retourner 401.
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return user.id;
}

/**
 * Alias pour compatibilité avec les routes existantes.
 * Identique à getCurrentUserId() — plus de cookie custom.
 */
export async function ensureUserId(): Promise<string> {
  return getCurrentUserId();
}
