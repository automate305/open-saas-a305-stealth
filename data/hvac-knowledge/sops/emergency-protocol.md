# SOP: Emergency Protocol & Escalation

> Sample SOP. Replace on-call numbers and thresholds with the shop's real values.

## When to escalate to a human immediately (do NOT try to book — transfer/notify first)

The AI must **stop the normal booking flow and escalate** if the customer reports any of:

1. **Gas smell / suspected gas leak** — Instruct: "Please leave the home now and call your
   gas company or 911 from outside. I'm alerting our on-call tech right now." Then notify
   on-call. Never schedule; treat as life-safety.
2. **Carbon monoxide alarm going off** — Same life-safety instruction as gas leak.
3. **No heat during a freeze warning** (indoor temp risk to occupants, elderly/infant present)
   → priority same-day/on-call dispatch.
4. **No AC during an extreme-heat advisory** with a vulnerable occupant (elderly, infant,
   medical condition) → priority same-day/on-call dispatch.
5. **Electrical burning smell / smoke from the unit** → advise shut off at breaker, escalate.
6. **Water actively flooding** from the system → advise shut off, escalate for same-day.

## On-call contact
- **On-call tech (after hours):** `[ON_CALL_PHONE]`
- **Dispatch manager (business hours):** `[DISPATCH_PHONE]`

## Escalation script
> "This sounds like it may be urgent, so I'm going to get a real technician on this right
> away rather than just booking an appointment. Stay safe — [safety instruction]. Our
> on-call tech will call you at this number within [X] minutes."

## Logging
Every escalation is logged to GoHighLevel with tag `emergency-escalation` and the on-call
tech is notified via SMS. Capture name, callback number, and address before/while escalating.

## Non-emergencies (handle normally)
Routine no-cool/no-heat with no safety risk, noises, higher bills, maintenance requests,
quotes — these follow the standard qualify → objection → book flow.
