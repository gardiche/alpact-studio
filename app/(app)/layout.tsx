import { ShellClient } from "@/components/shell/ShellClient";
import { DEMO } from "@/lib/demo/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = {
    id: "demo",
    email: "demo@alpact.studio",
    first_name: null,
    last_name: null,
    project_name: null,
    project_description: null,
    stage: null,
    sector: null,
    team_size: null,
    founded_at: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <ShellClient user={user} notifications={DEMO.notifications}>
      {children}
    </ShellClient>
  );
}
