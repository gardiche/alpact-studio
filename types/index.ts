export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  project_name: string | null;
  project_description: string | null;
  stage: "démarrage" | "early-stage" | "post-levée" | null;
  sector: string | null;
  team_size: number | null;
  founded_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tool: "astryd" | "elyse" | "gyna";
  type: "warning" | "critique" | "rappel";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  tool: "astryd" | "elyse" | "gyna" | "hub";
  action_type: "decision" | "alert" | "milestone" | "action";
  title: string;
  description: string | null;
  link: string | null;
  created_at: string;
}

export interface CopilotMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  page_context: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: "pennylane" | "qonto" | "stripe" | "notion" | "google" | "hubspot" | "slack";
  status: "connected" | "disconnected" | "error";
  access_token: string | null;
  refresh_token: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}
