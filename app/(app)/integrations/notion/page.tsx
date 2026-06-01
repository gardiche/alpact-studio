import { NotionPagesManager } from "@/components/integrations/notion/NotionPagesManager";

export default async function NotionIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<{ just_connected?: string }>;
}) {
  const params = await searchParams;
  const justConnected = params.just_connected === "1";

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        <NotionPagesManager justConnected={justConnected} />
      </div>
    </div>
  );
}
