// HVAC knowledge-base loader + lightweight retriever.
//
// Intentionally dependency-free: a keyword-overlap retriever over the embedded docs
// (knowledgeData.ts). Good enough to ground answers and cite sources without standing up a
// vector DB. Swap `retrieve()` for an embeddings/Windsor-backed retriever later without
// touching the operations or UI.

import {
  knowledgeDocs,
  skillDocs,
  type KnowledgeDoc,
} from "./knowledgeData";

export type HvacChannel = "receptionist" | "chatbot";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "is", "it",
  "my", "i", "me", "you", "your", "we", "our", "how", "much", "do", "does",
  "can", "with", "at", "be", "this", "that", "have", "has", "get", "got",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    // Keep 2-char tokens: "ac" is a core HVAC term and must not be filtered out.
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

export interface RetrievedChunk {
  /** Citation id, e.g. "pricing/ac-repair-2024.md". */
  source: string;
  content: string;
  score: number;
}

/**
 * Return the top-`k` knowledge docs most relevant to `query`, by keyword overlap.
 * Emergency-protocol always gets a boost so safety triggers surface even on short queries.
 */
export function retrieve(query: string, k = 4): RetrievedChunk[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = knowledgeDocs.map((doc: KnowledgeDoc) => {
    const docTokens = tokenize(doc.content);
    let overlap = 0;
    for (const t of docTokens) if (queryTokens.has(t)) overlap += 1;
    let score = overlap / Math.sqrt(docTokens.length || 1);
    if (doc.id.startsWith("sops/emergency-protocol") && looksUrgent(query)) {
      score += 1; // ensure safety doc is retrieved for urgent phrasing
    }
    return { source: doc.id, content: doc.content, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const URGENT_PATTERNS =
  /\b(gas|smoke|burning|carbon monoxide|co alarm|flood|leak|no heat|no ac|sparks?)\b/i;

export function looksUrgent(query: string): boolean {
  return URGENT_PATTERNS.test(query);
}

function getSkill(channel: HvacChannel): string {
  const wanted =
    channel === "receptionist"
      ? "hvac-ai-receptionist.md"
      : "hvac-ai-chatbot.md";
  return skillDocs.find((s) => s.id === wanted)?.content ?? "";
}

/**
 * Build the system prompt for a channel: the skill instructions + the retrieved
 * knowledge chunks + hard grounding/citation rules.
 */
export function buildSystemPrompt(
  channel: HvacChannel,
  chunks: RetrievedChunk[],
  shopName: string,
): string {
  const skill = getSkill(channel);
  const context = chunks.length
    ? chunks
        .map((c) => `--- SOURCE: ${c.source} ---\n${c.content}`)
        .join("\n\n")
    : "(no matching knowledge-base documents were retrieved)";

  return [
    `You are the Automate305 HVAC AI ${
      channel === "receptionist" ? "Receptionist (phone)" : "Chatbot (web/SMS)"
    } for "${shopName}".`,
    "",
    "Follow this skill definition exactly:",
    skill,
    "",
    "GROUNDING RULES (non-negotiable):",
    "- Answer ONLY using the RETRIEVED KNOWLEDGE below. Do not use outside knowledge for prices, policies, or availability.",
    "- Cite every factual claim inline as [Source: <doc id> § <section>].",
    "- If the answer is not in the retrieved knowledge, do NOT guess. Say you'll have a human follow up, and (chatbot) offer to capture their info.",
    "- Never invent a price. Use 'starting at' / range language from the pricing sheet only.",
    "- If the customer's message indicates a safety emergency (gas, CO, smoke, flooding, no-heat/no-cool with a vulnerable person), STOP the booking flow and follow sops/emergency-protocol.md.",
    "",
    "RETRIEVED KNOWLEDGE:",
    context,
  ].join("\n");
}

export function listKnowledge(): { id: string; bytes: number }[] {
  return knowledgeDocs.map((d) => ({ id: d.id, bytes: d.content.length }));
}

export function listSkills(): { id: string }[] {
  return skillDocs.map((s) => ({ id: s.id }));
}
