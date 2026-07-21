# HVAC Knowledge Base (RAG Source of Truth)

This folder is the **single source of truth** for the Automate305 HVAC AI Receptionist
and AI Chatbot skills. Every customer-facing answer those skills produce must be grounded
in — and cite — a document in this folder. If an answer can't be traced to a doc here, the
skill is required to escalate to a human instead of guessing.

## Structure

```
data/hvac-knowledge/
├── sops/               # Service procedures, warranty & escalation policies
├── pricing/            # Service pricing, packages, promotions, financing
├── faqs/               # Common customer questions + objection responses
├── call-transcripts/   # Past calls (won/lost) used for objection-handling patterns
└── services/           # Service descriptions, timelines, equipment specs
```

## How the skills consume this folder

Both skills load these docs as retrieval context. Two supported modes:

1. **Local files** (default, works today): the skill reads the `.md` files under this path.
2. **Windsor MCP / hosted RAG** (optional): the same docs are indexed by an external
   retrieval service and pulled at runtime. Not required for the skill to function.

## Per-shop customization

The sample docs below use a placeholder shop identity. To onboard a real shop, replace the
`[Shop Name]`, pricing numbers, phone numbers, and service areas with that shop's real data.
Keep the filenames and section headings stable — the skills cite documents by
`folder/filename.md` and by section heading, so renaming breaks citations.

## Citation format

Skills cite sources inline as `[Source: <folder>/<file>.md § <section>]`, e.g.
`[Source: pricing/ac-repair-2024.md § Diagnostic Fee]`.

> ⚠️ **Sample data notice:** All numbers, transcripts, and policies in this starter set are
> realistic placeholders for template/demo purposes — not a real shop's live data. Replace
> before production use.
