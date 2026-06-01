// Wrapper @notionhq/client typé pour le contexte Alpact
// Note : depuis la version récente du SDK, `search()` renvoie des `page` et
// `data_source` (les "databases" sont devenues des "data sources").
import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  SearchResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { DataSourceObjectResponse } from "@notionhq/client/build/src/api-endpoints/data-sources";
import type { NotionPageRef, NotionPageCategory } from "@/types/integrations";

type SearchableObject = PageObjectResponse | DataSourceObjectResponse;

export function notionClient(accessToken: string): Client {
  return new Client({ auth: accessToken });
}

// ============================================================
// Catégorisation intelligente des pages
// ============================================================

/** Mots-clés stratégiques — pitch, roadmap, vision, BP, OKR, stratégie, levée, investors... */
const STRATEGIC_KEYWORDS = [
  "pitch", "roadmap", "vision", "business plan", "business model",
  "bp ", "okr", "objectif", "strateg", "levée", "fundrais", "investor",
  "deck", "canvas", "swot", "pest", "value prop", "mission",
  "plan d'action", "plan strateg", "go-to-market", "gtm",
  "kpi", "north star", "product market fit", "pmf",
  "cap table", "valorisation", "milestones",
];

/** Mots-clés opérationnels — process, templates, guides... */
const OPERATIONAL_KEYWORDS = [
  "process", "template", "checklist", "onboarding", "guide",
  "procédure", "sop", "tutoriel", "how to", "how-to",
  "faq", "documentation", "wiki", "manuel",
];

function categorize(
  obj: SearchableObject,
  title: string
): { category: NotionPageCategory; recommended: boolean } {
  // 1. Les data_sources (databases) → catégorie "data"
  if (obj.object === "data_source") {
    return { category: "data", recommended: false };
  }

  // 2. Pages enfants de databases → catégorie "data" (entrées CRM, fiches, etc.)
  const page = obj as PageObjectResponse;
  if (page.parent.type === "database_id") {
    return { category: "data", recommended: false };
  }

  const lower = title.toLowerCase();

  // 3. Pages avec titre vide ou très court → empty
  if (lower.length < 3) {
    return { category: "empty", recommended: false };
  }

  // 4. Mots-clés stratégiques → strategic + recommandé
  if (STRATEGIC_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "strategic", recommended: true };
  }

  // 5. Mots-clés opérationnels → operational, pas recommandé par défaut
  if (OPERATIONAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "operational", recommended: false };
  }

  // 6. Pages racine du workspace → narrative + recommandé
  if (page.parent.type === "workspace") {
    return { category: "narrative", recommended: true };
  }

  // 7. Pages sous-pages (parent = page_id) → narrative, pas recommandé
  //    (l'user peut les cocher manuellement si pertinent)
  return { category: "narrative", recommended: false };
}

// Fraîcheur : déprioritiser les pages non modifiées depuis > 90 jours
const STALE_DAYS = 90;
function isStale(lastEditedTime: string): boolean {
  const diff = Date.now() - new Date(lastEditedTime).getTime();
  return diff > STALE_DAYS * 86400000;
}

// ============================================================
// Listing : récupère les pages/data sources auxquelles
// l'intégration a été partagée, catégorisées et triées.
// ============================================================

export async function listAccessiblePages(accessToken: string): Promise<NotionPageRef[]> {
  const notion = notionClient(accessToken);
  const results: NotionPageRef[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: SearchResponse = await notion.search({
      page_size: 100,
      start_cursor: cursor,
      sort: { direction: "descending", timestamp: "last_edited_time" },
    });

    for (const item of response.results) {
      const ref = mapToPageRef(item);
      if (ref) results.push(ref);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  // Tri : recommandées d'abord, puis par fraîcheur
  results.sort((a, b) => {
    // Recommandées en premier
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    // Pages "empty" en dernier
    if (a.category === "empty" && b.category !== "empty") return 1;
    if (a.category !== "empty" && b.category === "empty") return -1;
    // Par date de dernière modification (récent d'abord)
    return new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime();
  });

  return results;
}

function mapToPageRef(
  item: SearchResponse["results"][number]
): NotionPageRef | null {
  if (item.object !== "page" && item.object !== "data_source") return null;
  // Filtrer les objets partiels (sans propriétés)
  if (!("parent" in item)) return null;

  const obj = item as SearchableObject;
  const title = extractTitle(obj);
  if (!title) return null;

  const { category, recommended: baseRecommended } = categorize(obj, title);

  // Déprioritiser les pages stale même si elles seraient normalement recommandées
  const recommended = baseRecommended && !isStale(obj.last_edited_time);

  return {
    id: obj.id,
    object: obj.object === "page" ? "page" : "database",
    title,
    icon: extractIcon(obj),
    url: obj.url,
    parent_type: obj.parent.type as NotionPageRef["parent_type"],
    parent_title: null,
    last_edited_time: obj.last_edited_time,
    created_time: obj.created_time,
    category,
    recommended,
  };
}

function extractTitle(obj: SearchableObject): string {
  if (obj.object === "data_source") {
    const ds = obj as DataSourceObjectResponse;
    return ds.title.map((t) => t.plain_text).join("").trim() || "Base sans titre";
  }
  const page = obj as PageObjectResponse;
  for (const [, prop] of Object.entries(page.properties)) {
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("").trim() || "Page sans titre";
    }
  }
  return "Page sans titre";
}

function extractIcon(obj: SearchableObject): string | null {
  if (!obj.icon) return null;
  if (obj.icon.type === "emoji") return obj.icon.emoji;
  if (obj.icon.type === "external") return obj.icon.external.url;
  if (obj.icon.type === "file") return obj.icon.file.url;
  return null;
}

// ============================================================
// Extraction : récupère le contenu textuel d'une page (blocks)
// pour alimenter le contexte Alpact.
// ============================================================

export async function extractPageContent(accessToken: string, pageId: string): Promise<string> {
  const notion = notionClient(accessToken);
  const blocks = await fetchAllBlocks(notion, pageId);
  return blocksToText(blocks);
}

async function fetchAllBlocks(notion: Client, blockId: string): Promise<BlockObjectResponse[]> {
  const all: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    for (const block of response.results) {
      if ("type" in block) {
        all.push(block as BlockObjectResponse);
      }
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return all;
}

function blocksToText(blocks: BlockObjectResponse[]): string {
  const lines: string[] = [];
  for (const block of blocks) {
    const text = blockToText(block);
    if (text) lines.push(text);
  }
  return lines.join("\n");
}

function blockToText(block: BlockObjectResponse): string {
  switch (block.type) {
    case "paragraph":
      return richTextToString(block.paragraph.rich_text);
    case "heading_1":
      return `# ${richTextToString(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${richTextToString(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${richTextToString(block.heading_3.rich_text)}`;
    case "bulleted_list_item":
      return `- ${richTextToString(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `1. ${richTextToString(block.numbered_list_item.rich_text)}`;
    case "to_do":
      return `${block.to_do.checked ? "[x]" : "[ ]"} ${richTextToString(block.to_do.rich_text)}`;
    case "toggle":
      return richTextToString(block.toggle.rich_text);
    case "quote":
      return `> ${richTextToString(block.quote.rich_text)}`;
    case "callout":
      return richTextToString(block.callout.rich_text);
    case "code":
      return `\`\`\`${block.code.language}\n${richTextToString(block.code.rich_text)}\n\`\`\``;
    case "divider":
      return "---";
    default:
      return "";
  }
}

interface RichTextItem {
  plain_text: string;
}

function richTextToString(rt: RichTextItem[]): string {
  return rt.map((r) => r.plain_text).join("").trim();
}
