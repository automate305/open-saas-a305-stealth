# Automate305 HVAC Skills

Two production-oriented, RAG-grounded skills for HVAC shops. Both are grounded in
`data/hvac-knowledge/` — every customer-facing claim must cite a doc there.

| Skill | Channel | Job |
|---|---|---|
| [`hvac-ai-receptionist.md`](./hvac-ai-receptionist.md) | Phone (voice) | Answer missed calls, qualify, handle objections, book, SMS-confirm |
| [`hvac-ai-chatbot.md`](./hvac-ai-chatbot.md) | Web widget + SMS | Qualify leads, photo-diagnose, handle objections, book, nurture |

**Design rule — one job per skill:** Receptionist = phone. Chatbot = web/SMS. Don't merge them.

---

## Integration checklist (connecting to a client's GoHighLevel account)

- [ ] Create/confirm the shop's **GoHighLevel** sub-account.
- [ ] Authorize **Windsor.ai** (or your RAG/automation bridge) against that GHL account.
- [ ] Map the GHL **calendar** used for bookings (calendar ID).
- [ ] Map the GHL **pipeline + stages** for lead logging (`inbound-call`, `web-lead`, `nurture`).
- [ ] Configure the **SMS sending number** (A2P 10DLC registered) for confirmations/follow-ups.
- [ ] Set the **on-call tech** + **dispatch** phone numbers in `sops/emergency-protocol.md`.
- [ ] Replace all `[Shop Name]`, `[SERVICE_AREA]`, `[BRANDS_CARRIED]`, pricing, and phone
      placeholders in `data/hvac-knowledge/` with the shop's real data.
- [ ] Load the shop's **real** SOPs, pricing sheet, FAQs, and 3–5 winning call transcripts.
- [ ] Point the skills' KB loader at the local files **or** the hosted RAG index.
- [ ] Smoke-test each of the 5 scenarios below against a **staging** GHL calendar.

> ⚠️ Windsor ↔ GHL live sync and the live `Use Windsor…` booking test require those
> connectors to be authorized in the runtime — they are **not** wired up in this repo/session.

---

## Test protocol (5 scenarios — expected behavior)

Run each against a staging GHL calendar once integrations are live.

1. **Missed call at 8pm** → books job for next morning; SMS confirmation sent.
2. **Price objection** → pulls financing/diagnostic-waived line from
   `pricing/ac-repair-2024.md`; books after reframe.
3. **Emergency call (gas/no-heat)** → escalates to on-call per
   `sops/emergency-protocol.md`; does **not** book.
4. **Web visitor: "how much for a new AC"** → gives range, books a free consult per
   `services/ac-installation.md`.
5. **Reschedule request** → updates the existing GHL calendar event; re-sends confirmation.

---

## Optional: PR workflow
The original brief referenced `./scripts/pr-skill.sh` for promoting a skill to Automate305
core. That script does not exist in this repo yet. If you want it, we can add a small script
that opens a PR for a given skill file.
