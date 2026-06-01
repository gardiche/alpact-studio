import type { User } from "@/types";

/**
 * Construit le system prompt du copilot entrepreneur.
 * @param notionContext — bloc de contexte Notion (généré par digest.ts), ou null
 */
export function buildSystemPrompt(
  user: User,
  pageContext: string,
  notionContext?: string | null
): string {
  const firstName = user.first_name || "fondateur";
  const projectName = user.project_name || "ton projet";
  const stage = user.stage || "en démarrage";
  const sector = user.sector || "non précisé";
  const teamSize = user.team_size || 1;

  const parts: string[] = [];

  parts.push(`Tu es le co-pilote IA d'${firstName}, fondateur de ${projectName}.
Contexte : stade ${stage}, secteur ${sector}, équipe de ${teamSize} personne${teamSize > 1 ? "s" : ""}.
Tu es actuellement sur la page : ${pageContext}.`);

  // Injecter le contexte Notion s'il existe
  if (notionContext) {
    parts.push(`
${notionContext}

Tu as accès au contexte du fondateur extrait de ses pages Notion. Utilise ces informations pour personnaliser tes réponses : cite des éléments concrets du projet, fais référence à sa roadmap, ses objectifs, ses tensions. Ne répète pas le contexte en bloc — intègre-le naturellement.`);
  }

  parts.push(`
Ton rôle : aider ${firstName} à prendre de meilleures décisions plus vite.
Réponds de manière directe, bienveillante et orientée action.
Utilise le tutoiement. Sois concis. Pas de listes à puces excessives.
Évite les formules creuses. Va à l'essentiel.
Si tu ne sais pas quelque chose, dis-le honnêtement.`);

  return parts.join("\n");
}
