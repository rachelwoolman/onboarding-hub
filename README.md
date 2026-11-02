# BrightPath Start 🌱

**One page. One task at a time. A plant that grows as you go.**

BrightPath Start is an onboarding prototype for BrightPath Technologies, a 150-person health-tech
company. A new hire gets a single page built from their role and start date. It shows the one
thing to do next, never a checklist. The page gets smaller as they finish, until there's nothing
left.

> A list, even a pretty one, reads as work. Chloe had seven onboarding emails and froze. This
> page answers one question: *what do I do next?*

---

## The problem

It's Friday evening. Chloe, a new software engineer, starts on Monday. She has seven separate
emails about forms, accounts and access, and no idea where to start or whether she's missed
something.

Her manager, Mateo, has three new hires. He wants to know who's on track and to approve requests
quickly, without chasing anyone.

## What it does

### Chloe's page (the new hire)
- **One task at a time.** Each task is done right inside the card: no modals, no new pages.
- **"27 minutes and you're ready for Monday."** Three short stops: *Your details* (2 min),
  *Paperwork* (15 min) and *Connect with your team* (10 min).
- **Honest tasks:**
  - **Confirm your details:** HR already has her name, phone and email, so she just confirms
    them, or edits one line.
  - **I-9 and W-4:** handed off to a secure HR portal (mocked). Sensitive data never touches
    this app.
  - **Slack invite:** four quick steps.
  - **Request your dev tools:** she ticks GitHub, Jira or the cloud console, and one request
    goes to Mateo for approval.
- **A plant that grows** from a sprout to full bloom as she finishes.
- **The all-set screen:**
  - "You're all set for Monday!", with a tappable list of what's done and her request's status.
  - A read-only **Coming up** card: a warm first-day note from HR, plus a preview of Week 1 and
    the first month.

### Mateo's page (the manager)
- **"1 thing needs you."** A slim strip appears only when Chloe's request is waiting on him.
- **New hires,** with Chloe first. Her card shows her real progress, what she's finished, and
  **Approve** or **Decline**, which asks for a short reason.
- **Everyone else is calm:** Priya and Jordan are on track, with nothing for him to do.

### The approval loop (the demo moment)
1. Chloe requests her dev tools.
2. Mateo approves (or declines with a note).
3. Chloe sees it move: *Requested → With Mateo → Approved → Ready*.

Both views share one store, so switching **View as** shows each change instantly. If Mateo
declines, Chloe sees his note and fixes the request in place.

---

## Run it

```bash
npm install
npm run dev      # start the app
npm test         # 31 unit tests (Vitest)
npm run build    # type check + production build
npm run lint     # Oxlint
```

### Demo controls
| Control | What it does |
|---|---|
| **View as: New hire / Manager** (top right) | Switches between Chloe's and Mateo's pages. |
| **Fast-forward Chloe** | Finishes her pre-start tasks and sends the request in one click. |
| **Jump to Monday** | Moves the demo clock to day 1. Press again to step to later phases. |
| **Reset data** | Starts over. Everything is stored in your browser. |

### A two-minute demo
1. **Reset**, then click through Chloe's four tasks (or press **Fast-forward Chloe**).
2. Switch to **Manager**. Chloe's request is waiting. Press **Approve**.
3. Switch back to **New hire** and open "4 of 4 done". Her request shows *Approved*, then
   *Ready* a few seconds later.

---

## Design principles

- **One primary action on screen.** Never more than about three things competing for attention.
- **Time on every task,** in plain increments (1, 2, 5, 10, 15, 20 or 30 minutes).
- **Finishing makes the page smaller** and the plant bigger.
- **Waiting on someone else looks different,** and says who and when.
- **Overdue is gentle amber, never red.** Validation is specific and kind ("That phone number
  looks short").
- **Calm, botanical look:** cream and forest green, a soft serif for big moments, hand-built
  SVG plants. Mobile first (390px and up), and it respects reduced motion.

## How it's built

- **Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 and Vitest. No backend; state lives in
  React context and is saved to `localStorage`, with recovery from corrupt saved data.
- **Role-based plans:** `generatePlan(role, startDate)` builds each plan from Engineering or
  Design templates. Every date is an offset from the start date, so moving a start date moves
  every deadline.
- **Layout:**
  - `src/data`: templates, plan generation, selectors and the reducer (all unit-tested).
  - `src/state`: the shared store.
  - `src/pages`: Chloe's and Mateo's pages.
  - `src/components`: the focus card, tasks, plant, journey and Coming up card.
- **Spec:** [`CLAUDE.md`](./CLAUDE.md) is the living product spec. Design references are in
  [`/design`](./design).

## Assumptions

- BrightPath has an office. Laptops and badges are handed out on day 1.
- Chloe opens the page on the Friday evening before a Monday start. The demo clock follows the
  next Monday, so it works whenever it's opened.
- Only "before day 1" is required now. Later weeks are previewed read-only and open on their
  date.
- Mateo approves access, and IT provisions it afterwards (simulated; IT has no screen).
- All sample data is fake.

## What I left out, and why

| Left out | Why |
|---|---|
| Sign-in, email and notifications | Not needed to test the core idea. The two views share local state instead. |
| A real HR portal | That belongs to the HR system. The prototype only shows the hand-off. |
| IT provisioning | Approvals turn "Ready" after a short simulated delay. |
| A template editor for HR | Templates are code for now. Worth building once the plan shape is proven. |
| A live AI assistant | Out of scope. A real one would answer from HR docs and policies. |
| Direct deposit, offer letter, background check | Handled by HR systems before or outside this page. |
| A native mobile app | The page is mobile-first instead. |

## Questions for the customer

- Is the team remote, hybrid or in-office? This changes day 1 completely.
- Who owns each access approval: the manager, IT or security?
- How often do start dates move, and who updates them?
- How does IT provision access today, and what does "ready" mean to them?
- Should managers send reminders, or should the system send them automatically?
- How should HR edit templates, and who reviews the changes?
- Is the existing MangoApps onboarding hub the system of record?

## How I made it

- **Design:** I explored layouts in Figma Make and used them as a starting point, not a spec.
- **Build:** I built it with Claude Code in small steps, one Conventional Commit per change.
- **What I verified myself:** I clicked through both views after every round, gave design and
  product feedback, and made the calls on the tradeoffs: one task at a time, handing paperwork to
  the portal, starting at zero, and keeping Mateo's page calm. Unit tests cover plans, dates,
  progress, validation and the approval flow. Every change was also checked in the browser: bad
  input, double clicks, refresh mid-flow, Reset, and phone width.
