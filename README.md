# BrightPath Start

A one-page onboarding prototype for BrightPath Technologies, a 150-person health-tech company.

Every new hire gets a single page built from their role and start date. It shows one task at a
time, a three-stop journey, and a plant that grows as they finish. The page shrinks as they go,
until there's nothing left.

**Who it's for**
- **Chloe**, a new software engineer starting Monday. It's Friday evening, she has seven
  onboarding emails, and she doesn't know where to start.
- **Mateo**, her engineering manager. He has three new hires and wants to see who's on track
  and who's blocked, and to approve requests quickly, without chasing anyone.
- **Sarah** in HR, who asked for this. She has no screen of her own yet: plans come from
  role templates she would eventually edit.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (Vitest)
npm run build    # type check + production build
npm run lint     # Oxlint
```

**Demo controls** (small footer at the bottom of the page)
- **View as: New hire / Manager** (top right) switches between Chloe's page and Mateo's. Both
  share one store, so an approval on one side shows up on the other straight away.
- **Jump to Monday** moves the demo clock to day 1. Pressing it again steps to later phases.
- **Reset data** starts over. All data lives in your browser's localStorage, and the demo
  recovers on its own from corrupt saved data.

**A two-minute demo**
1. As Chloe, confirm your details, finish the I-9/W-4 in the portal, accept Slack, and request
   your dev tools.
2. Switch to Manager. Chloe's request is in the "Needs you" strip. Approve it, or decline it
   with a note.
3. Switch back. Chloe's tracker moves to Approved, then Ready. If Mateo declined, she sees his
   note and fixes the request in place.

## The key bet: simplicity over lists

A checklist, even a pretty one, reads as work. Chloe's real problem was not knowing where to
start, so the page shows **one task at a time**. Everything else stays quiet:
- a three-stop journey with minutes per stop;
- a plant that grows as she finishes;
- a single footer line for what's done and what's waiting on other people.

When she's finished before day 1, the page says so and previews what's coming. There's nothing
more to do.

## Assumptions

- BrightPath has an office. Laptops and badges are handed out on day 1, not shipped.
- Chloe opens the page on the Friday evening before a Monday start. The demo clock is anchored
  to the next Monday, so the story works whenever the demo is opened.
- Plans come from role templates (Engineering, Design). Every date is an offset from the start
  date; nothing is a hard-coded calendar date.
- Only "before day 1" is required now. Later weeks can be previewed, read-only, and open on
  their date.
- HR already has her name, phone and personal email, so she confirms them rather than typing.
- Sensitive paperwork (I-9, W-4) is finished in a secure HR portal, never in this app. The
  portal is mocked.
- Mateo approves access requests and IT provisions afterwards (simulated; IT has no screen).
- All sample data is fake (names, 555-01xx phone numbers, emails).

## What I left out, and why

| Left out | Why |
|---|---|
| Real sign-in, email and notifications | Not needed to test the core idea. The two views share local state instead. |
| A template builder for Sarah | Templates are code for now. Worth building once the plan shape is proven. |
| A real HR portal integration | Belongs to the HR system. The prototype only shows the hand-off. |
| IT provisioning | IT has no screen. Approvals turn "Ready" after a short simulated delay. |
| A live AI assistant | Out of scope. A real one would answer from HR docs and policies. |
| Direct deposit and the offer letter / background check | Handled by HR systems before or outside this page, and they made the starting numbers misleading. |
| Native mobile app | The page is mobile-first and works at 390px. |

## Questions for the customer

- Is the team remote, hybrid or in-office? This changes day 1 completely.
- Who owns each access approval: the manager, IT or security?
- How often do start dates move, and who updates them?
- How does IT provision access today, and what does "ready" mean to them?
- Should managers be able to send reminders, or should the system send them automatically?
- How should Sarah edit templates, and who reviews her changes?
- Is the existing MangoApps onboarding hub the system of record? Should this page read from it?

## How I built it

- **Design:** I explored layouts in Figma Make (screenshots are in `/design`) and used them as
  a starting point rather than a spec.
- **Build:** I built it with Claude Code in small steps, one Conventional Commit per change.
  Stack: Vite, React, TypeScript, Tailwind v4, Vitest. No backend.
- **What I verified myself:** I clicked through both views after each round, gave design and
  product feedback, and decided the tradeoffs: one task at a time, handing paperwork to the
  portal, starting at zero, where the approval tracker lives, and Mateo's garden. Unit tests
  cover the plan, dates, progress counts, the approval flow and the garden order. Every change
  was also checked in the browser: bad input, double clicks, refresh mid-flow, Reset, and phone
  width.
