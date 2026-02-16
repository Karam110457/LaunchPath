/**
 * Central Mastra instance — registers all agents.
 * Import `mastra` from here in server actions and API routes.
 */

import { Mastra } from "@mastra/core";
import { demoAgents } from "./agents/demo-agents";
import { sergeAgent } from "./agents/serge-agent";
import { offerAgent } from "./agents/offer-agent";

export const mastra = new Mastra({
  agents: {
    ...demoAgents,
    serge: sergeAgent,
    offer: offerAgent,
  },
});
