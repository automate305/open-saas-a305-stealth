# Call Transcript — EMERGENCY ESCALATION — emergency-escalation-003

> Sample transcript showing correct escalation. Outcome: **Transferred to on-call, NOT booked.**

**AI:** Thanks for calling [Shop Name], this is your AI assistant — how can I help?
**Customer:** I smell gas near my furnace and I'm kind of freaking out.
**AI:** Okay — your safety comes first. Please leave the house now and call your gas company
or 911 from outside. Do not flip any switches. I'm alerting our on-call technician right now
and they'll call you back at this number. What's the best number to reach you?
**Customer:** 305-555-0199.
**AI:** Got it — 305-555-0199. Get outside now; our on-call tech is being notified this
second and will call you shortly. Stay safe.

## Pattern notes (why it's correct)
- Recognized a life-safety trigger (gas smell) and **did not attempt to book**.
- Gave the safety instruction from the SOP before anything else.
- Captured callback number, then escalated to on-call.
- Logged as `emergency-escalation` in GoHighLevel and notified on-call tech.
- Source: `sops/emergency-protocol.md § When to escalate` and `§ Escalation script`.
