import Anthropic from "@anthropic-ai/sdk";

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ||
  process.env.CLAUDE_MODEL ||
  "claude-sonnet-4-5-20250929";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
