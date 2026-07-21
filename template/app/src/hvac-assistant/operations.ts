import OpenAI from "openai";
import { env, HttpError } from "wasp/server";
import type {
  AskHvacAssistant,
  GetHvacKnowledgeBase,
} from "wasp/server/operations";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import {
  buildSystemPrompt,
  listKnowledge,
  listSkills,
  looksUrgent,
  retrieve,
} from "./knowledge";

const openAi = new OpenAI({ apiKey: env.OPENAI_API_KEY });

//#region Query: inspect the loaded knowledge base + skills
export type HvacKnowledgeBase = {
  skills: { id: string }[];
  docs: { id: string; bytes: number }[];
};

export const getHvacKnowledgeBase: GetHvacKnowledgeBase<
  void,
  HvacKnowledgeBase
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return { skills: listSkills(), docs: listKnowledge() };
};
//#endregion

//#region Action: RAG-grounded assistant reply
const askInputSchema = z.object({
  message: z.string().min(1, "Message is required"),
  channel: z.enum(["receptionist", "chatbot"]).default("chatbot"),
  shopName: z.string().min(1).default("[Shop Name]"),
});

type AskInput = z.infer<typeof askInputSchema>;

export type HvacAssistantReply = {
  reply: string;
  /** Doc ids that were retrieved and given to the model as grounding. */
  sources: string[];
  /** True if the message tripped a safety/emergency pattern. */
  isEmergency: boolean;
};

export const askHvacAssistant: AskHvacAssistant<
  AskInput,
  HvacAssistantReply
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  const { message, channel, shopName } = ensureArgsSchemaOrThrowHttpError(
    askInputSchema,
    rawArgs,
  );

  const chunks = retrieve(message);
  const systemPrompt = buildSystemPrompt(channel, chunks, shopName);

  const completion = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.3,
  });

  const reply =
    completion.choices[0]?.message?.content?.trim() ??
    "I'm sorry — I couldn't generate a response. Let me have a team member follow up.";

  return {
    reply,
    sources: chunks.map((c) => c.source),
    isEmergency: looksUrgent(message),
  };
};
//#endregion
