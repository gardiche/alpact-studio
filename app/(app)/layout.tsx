import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShellClient } from "@/components/shell/ShellClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupérer le profil complet
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Récupérer le profil entrepreneur si disponible
  const { data: entProfile } = await supabase
    .from("entrepreneur_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Récupérer les notifications non lues
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const userForShell = {
    id: user.id,
    email: user.email ?? "",
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    project_name: entProfile?.project_name ?? null,
    project_description: entProfile?.project_description ?? null,
    stage: entProfile?.stage ?? null,
    sector: entProfile?.sector ?? null,
    team_size: entProfile?.team_size ?? null,
    founded_at: entProfile?.founded_at ?? null,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? new Date().toISOString(),
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };

  return (
    <ShellClient user={userForShell} notifications={notifications ?? []}>
      {children}
    </ShellClient>
  );
}
