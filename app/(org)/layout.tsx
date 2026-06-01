import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgShellClient } from "@/components/shell/OrgShellClient";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupérer le membership de cette personne (première org trouvée)
  const { data: membership } = await supabase
    .from("org_memberships")
    .select(`
      id,
      org_id,
      user_id,
      role,
      created_at,
      profiles!org_memberships_user_id_fkey (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      organizations!org_memberships_org_id_fkey (
        id,
        name,
        type,
        logo_url,
        city,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/login");

  const profile = (membership.profiles as any) ?? {};
  const org = (membership.organizations as any) ?? {};

  const orgForShell = {
    id: org.id ?? "",
    name: org.name ?? "",
    type: org.type ?? "incubateur",
    logo_url: org.logo_url ?? null,
    city: org.city ?? null,
    created_at: org.created_at ?? new Date().toISOString(),
  };

  const memberForShell = {
    id: membership.id,
    org_id: membership.org_id,
    user_id: membership.user_id,
    role: membership.role,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    email: profile.email ?? user.email ?? "",
    avatar_url: profile.avatar_url ?? null,
    created_at: membership.created_at,
  };

  return (
    <OrgShellClient org={orgForShell} member={memberForShell}>
      {children}
    </OrgShellClient>
  );
}
