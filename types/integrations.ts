// Types pour les intégrations tierces (Notion, Pennylane, etc.)

export interface NotionIntegration {
  user_id: string;              // identifiant Alpact de l'utilisateur
  workspace_id: string;         // workspace Notion connecté
  workspace_name: string;
  workspace_icon: string | null;
  access_token: string;         // token OAuth Notion (chiffré en prod)
  bot_id: string;               // bot ID Notion (utile pour debugging)
  notion_user_id: string | null;
  notion_user_email: string | null;
  notion_user_name: string | null;
  connected_at: string;
  last_synced_at: string | null;
}

export type NotionObjectType = "page" | "database";

/** Catégorie attribuée automatiquement à chaque page Notion. */
export type NotionPageCategory =
  | "strategic"    // Pitch, roadmap, vision, BP, OKR — coeur du contexte fondateur
  | "operational"  // Process, templates, checklists, guides
  | "data"         // Databases Notion (CRM, tableaux) — futur Gyna
  | "narrative"    // Pages normales avec du contenu
  | "empty";       // Pages vides ou insignifiantes

export interface NotionPageRef {
  id: string;
  object: NotionObjectType;
  title: string;
  icon: string | null;
  url: string;
  parent_type: "workspace" | "page_id" | "database_id" | "block_id";
  parent_title: string | null;
  last_edited_time: string;
  created_time: string;
  /** Catégorie auto-attribuée pour le filtrage intelligent. */
  category: NotionPageCategory;
  /** Pré-cochée comme recommandée pour le contexte hub. */
  recommended: boolean;
}

export interface SelectedNotionPage {
  page_id: string;
  title: string;
  selected: boolean;
}

export interface NotionContextSnapshot {
  user_id: string;
  workspace_id: string;
  pages: NotionContextPage[];
  total_chars: number;
  synced_at: string;
}

export interface NotionContextPage {
  page_id: string;
  title: string;
  url: string;
  content: string;              // texte extrait (markdown-light)
  last_edited_time: string;
}

/** Digest structuré généré par Claude à partir du snapshot Notion. */
export interface NotionDigest {
  identity: string | null;      // nom projet, mission, proposition de valeur
  strategy: string | null;      // roadmap, objectifs, métriques cibles
  progress: string | null;      // état d'avancement concret
  signals: string | null;       // ce qui bouge, ce qui stagne
  resources: string | null;     // outils, process, équipe, stack
  summary: string;              // résumé condensé (~500 chars max)
  snapshot_id: string;
  generated_at: string;
}
