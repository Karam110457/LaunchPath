/**
 * Central Mastra instance — registers all agents and workflows.
 * Import `mastra` from here in server actions and API routes.
 */

import { Mastra } from "@mastra/core";
import { demoAgents } from "./agents/demo-agents";
import { sergeAgent } from "./agents/serge-agent";
import { offerAgent } from "./agents/offer-agent";
import { guaranteeAgent } from "./agents/guarantee-agent";
import { pricingAgent } from "./agents/pricing-agent";
import { demoBuilderAgent } from "./agents/demo-builder-agent";
import { offerGenerationWorkflow } from "./workflows/offer-generation";
import { demoBuilderWorkflow } from "./workflows/demo-builder";

export const mastra = new Mastra({
  agents: {
    ...demoAgents,
    serge: sergeAgent,
    offer: offerAgent,
    guarantee: guaranteeAgent,
    pricing: pricingAgent,
    "demo-builder": demoBuilderAgent,
  },
  workflows: {
    "offer-generation": offerGenerationWorkflow,
    "demo-builder": demoBuilderWorkflow,
  },
});
