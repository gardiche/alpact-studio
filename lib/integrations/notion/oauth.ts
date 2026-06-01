// OAuth Notion — construction de l'URL d'autorisation + échange code → access token
// Doc : https://developers.notion.com/docs/authorization

const NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

function getConfig() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Configuration Notion incomplète. Vérifie NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI dans .env.local"
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getConfig();
  const url = new URL(NOTION_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export interface NotionTokenResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  owner: {
    type: "user" | "workspace";
    user?: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      type: "person" | "bot";
      person?: { email: string };
    };
    workspace?: boolean;
  };
  duplicated_template_id: string | null;
}

export async function exchangeCodeForToken(code: string): Promise<NotionTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Notion token exchange failed (${res.status}): ${errorBody}`);
  }

  return (await res.json()) as NotionTokenResponse;
}
