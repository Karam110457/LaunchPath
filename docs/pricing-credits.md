# LaunchPath Credit Pricing

## Credit Formula

```
credits = round((inputTokens × inputPrice + outputTokens × outputPrice) / 1,000,000 × 150, 2)
```

- **CREDITS_PER_DOLLAR = 150** — 1 credit ≈ $0.00667 of API cost
- Input/output prices are per million tokens, sourced from OpenRouter/provider pricing
- Minimum 0.01 credits per request

## Subscription Tiers

| Tier     | Price/mo | Credits | $/credit | API budget* | Margin |
|----------|----------|---------|----------|-------------|--------|
| Free     | $0       | 200     | —        | $1.33       | —      |
| Starter  | $29      | 1,000   | $0.029   | $6.67       | 77%    |
| Growth   | $79      | 3,500   | $0.023   | $23.33      | 70%    |
| Agency   | $199     | 10,000  | $0.020   | $66.67      | 67%    |
| Scale    | $499     | 30,000  | $0.017   | $200.00     | 60%    |

*API budget = credits ÷ 150 (max API cost if user burns all credits)

## Profit Margins Per Tier

### Starter ($29/mo → 1,000 credits)
- Max API cost if all credits used: $6.67
- **Gross profit: $22.33 (77%)**
- At 50% utilisation: $25.67 profit (89%)

### Growth ($79/mo → 3,500 credits)
- Max API cost: $23.33
- **Gross profit: $55.67 (70%)**
- At 50% utilisation: $67.33 profit (85%)

### Agency ($199/mo → 10,000 credits)
- Max API cost: $66.67
- **Gross profit: $132.33 (67%)**
- At 50% utilisation: $165.67 profit (83%)

### Scale ($499/mo → 30,000 credits)
- Max API cost: $200.00
- **Gross profit: $299.00 (60%)**
- At 50% utilisation: $399.00 profit (80%)

## Example Credit Costs Per Message

Typical agent message: ~15,000 input tokens, ~500 output tokens.

| Model                  | Input $/M | Output $/M | API Cost   | Credits |
|------------------------|-----------|------------|------------|---------|
| GPT-4.1 Nano           | $0.10     | $0.40      | $0.0017    | 0.26    |
| GPT-4o Mini             | $0.15     | $0.60      | $0.0026    | 0.38    |
| GPT-4.1 Mini            | $0.40     | $1.60      | $0.0068    | 1.02    |
| Llama 3.3 8B            | $0.03     | $0.05      | $0.0005    | 0.07    |
| Gemini 2.5 Flash        | $0.30     | $2.50      | $0.0058    | 0.86    |
| Claude Haiku 4.5        | $1.00     | $5.00      | $0.0175    | 2.63    |
| GPT-4o                  | $2.50     | $10.00     | $0.0425    | 6.38    |
| Claude Sonnet 4.5       | $3.00     | $15.00     | $0.0525    | 7.88    |
| Claude Opus 4.6         | $5.00     | $25.00     | $0.0875    | 13.13   |

## Messages Per Tier (at typical 15K input / 500 output)

| Model            | Starter (1K) | Growth (3.5K) | Agency (10K) | Scale (30K) |
|------------------|-------------|---------------|--------------|-------------|
| GPT-4.1 Nano     | 3,846       | 13,462        | 38,462       | 115,385     |
| GPT-4o Mini      | 2,632       | 9,211         | 26,316       | 78,947      |
| GPT-4.1 Mini     | 980         | 3,431         | 9,804        | 29,412      |
| Haiku 4.5        | 380         | 1,331         | 3,802        | 11,407      |
| GPT-4o           | 157         | 549           | 1,567        | 4,702       |
| Sonnet 4.5       | 127         | 444           | 1,269        | 3,807       |
| Opus 4.6         | 76          | 267           | 762          | 2,285       |

## Knowledge Base Limits Per Tier

| Tier     | Max Documents | Max Chunks | ~Equivalent Pages |
|----------|--------------|------------|-------------------|
| Free     | 10           | 200        | ~50               |
| Starter  | 50           | 500        | ~125              |
| Growth   | 100          | 1,500      | ~375              |
| Agency   | 200          | 3,000      | ~750              |
| Scale    | 500          | 10,000     | ~2,500            |

- **Chunk-based limits** are the primary gate — document count is a secondary soft cap
- ~4 chunks per page at 800-token target chunk size
- FAQs = 1 chunk each, so they're cheap against the budget
- Website scrapes produce ~1 chunk per 1,600 chars of content
- Uploaded docs (PDF/DOCX) use ~3,200 char chunks by default
- Embedding cost is one-time at ingest (~$0.02 per 1M tokens via OpenAI `text-embedding-3-small`)
- At Scale tier (10K chunks), one-time embedding cost ≈ $0.06 — negligible vs ongoing chat credits

### Why chunk-based, not document-based?

A single PDF can produce 5 chunks or 500 chunks. Document-count limits are misleading — a user with 20 one-page FAQs uses far fewer resources than a user with 5 large PDFs. Chunk limits align cost with actual storage, embedding, and retrieval overhead.

## Design Rationale

- **Constant 150** gives 60-77% margins across all tiers — healthy for infrastructure SaaS
- Split input/output pricing is fair: input-heavy agents (lots of context, tools) don't get overcharged vs output-heavy agents
- BMA competitor uses constant 115 but is failing (-58% MRR) due to audience, not pricing — our higher constant is justified by infrastructure positioning and better margins
- Upgrade triggers are client limits and feature gates, not credit consumption
- Most users on fast/standard models will get thousands of messages per tier
