import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { HvacAssistantPage } from "./HvacAssistantPage" with { type: "ref" };
import {
  askHvacAssistant,
  getHvacKnowledgeBase,
} from "./operations" with { type: "ref" };

export const hvacAssistantSpec: Spec = [
  route(
    "HvacAssistantRoute",
    "/hvac-assistant",
    page(HvacAssistantPage, { authRequired: true }),
  ),

  // Stateless RAG feature: reads identity via context.user, no entity tables needed.
  query(getHvacKnowledgeBase, { entities: [] }),
  action(askHvacAssistant, { entities: [] }),
];
