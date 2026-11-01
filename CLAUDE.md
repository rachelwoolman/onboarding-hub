# BrightPath Start: onboarding prototype

## What this is
A one-page, temporary onboarding experience for BrightPath Technologies (150 employees).
Each person gets ONE page generated from their role and start date. It shrinks as they
finish things; by day 30 it is nearly empty: "You're fully onboarded 🌱".
No sidebar, no tabs, no notification bell, no separate pages. The only navigation is a small
"View as: New hire / Manager" toggle (top right) for demo purposes.

Core bet: SIMPLICITY OVER EVERYTHING. A list, even a pretty one, reads as work. Chloe sees ONE
task at a time, a short journey, and a plant that grows. Not a checklist.

## Design direction
Screenshots are in /design (chloe-home, mateo-garden, etc.). Use them as the starting point for
layout, spacing and feel, but do NOT copy them pixel for pixel. Make the result more thoughtful,
organized and crafted than the mockups:
- Calm, botanical, health-tech feel. A clean green-and-cream palette: warm off-white background,
  deep forest/teal text, ONE confident green accent, soft sage tints for surfaces.
- Clear typographic hierarchy: a soft serif for names and big moments ("Hi Chloe"), a clean sans
  for everything else. Generous whitespace and a consistent spacing scale.
- Organized: everything aligns to a clear grid; consistent card radius (20px), consistent shadows,
  consistent chip styles.
- Creative touches, used with restraint: a hand-built SVG plant with 4 growth stages and gentle
  sway; subtle leaf/vine details on the journey path; a soft gradient glow behind the plant;
  smooth card transitions; a small "bloom" celebration (a few floating petals/sparkles) when a
  stop or the whole list is completed. Respect prefers-reduced-motion.
- Every creative element must make the page calmer or clearer. If it adds clutter, cut it.
- Ignore Figma artifacts: the "?" help bubble, and any Thursday/October dates.
- Mobile first: must look great at 390px wide and on desktop.

## Users
- Chloe Zhang (PRIMARY, ~70% of effort): new software engineer, starts MONDAY. It's Friday
  evening, 3 days before. She found 7 separate emails and froze. Excited but overwhelmed.
  She wants to know where to start and that she isn't missing anything.
  Jobs to be done: (1) know the one thing to do first, (2) finish everything before day 1,
  (3) be reassured nothing is missed, (4) know when something is waiting on someone else and
  that it's not her fault, (5) know a request actually went through.
- Mateo Santos (SECONDARY, ~25%): engineering manager, 10 reports, 3 new hires. Wants to see
  who is on track and who is blocked without chasing people, and to approve things quickly.
- Sarah, HR manager (the requester): no UI. Role-based plans come from hardcoded templates she
  would eventually edit.

## Principles
1. "Before day 1" is the ONLY priority. Copy: "35 minutes and you're ready for Monday."
2. One primary action on screen at a time. Never more than ~3 things competing for attention.
3. Short copy. Warm, never corporate. About 40 words visible above the fold.
4. Time estimate on every task, shown as a small chip.
5. Waiting-on-others items look different (blue-gray, no checkbox) and say who and when.
6. Completing things makes the page SMALLER and the plant BIGGER.
7. Overdue is gentle amber, never red.

## Chloe's page (top to bottom, single centered column, max width ~720px)
1. Header: "Hi Chloe 🌱" (soft serif name). Subline: "35 minutes and you're ready for Monday."
   (minutes = remaining time, updates as tasks complete). Illustrated plant top right with caption
   "2 of 8 done". Plant stages: seed (0%), sprout (>0%), leafy (>=60%), bloom (100%).
2. Journey path: horizontal row of 3 stops joined by a line: "Quick start · 2 min",
   "Paperwork · 20 min", "Get connected · 13 min". Current stop highlighted green, others muted.
   Names and times only. Completed stops show a check.
3. Focus card: ONE task, centered, white card, soft shadow. Small group label, time chip,
   task title, one short why-line, a "Mark done" button, and an accurate count like
   "1 of 1 left in this stop". If the task has steps (Slack), the card expands IN PLACE to show
   4 short checkable steps. No modals. Completing a task: card animates away, next slides in,
   plant updates.
4. Up next: below the card, muted title-only chips ("Direct deposit", "Slack invite", "+3 more").
   No checkboxes, no due dates.
5. One quiet footer line: "2 done · 1 waiting on others". Each part expands in place.
   - Done: finished tasks, strikethrough, soft green checks. Reviewable.
   - Waiting: compact rows, no checkbox. "Your BrightPath accounts: IT is setting these up,
     ready Monday morning" and an approval tracker pill "Repo access: waiting on Mateo" that
     expands to a 4-step tracker (Requested, Waiting on Mateo, Approved, Ready) with caption
     "Mateo has your request. He usually responds within a day."
6. Small round floating chat button -> "Onboarding assistant" panel. Suggested-question chips,
   canned answers for ~5 FAQs, and a "Still stuck? Contact HR" box on every answer.
   Chips: "What do I wear on day 1?", "When do I get my laptop?", "How do benefits work?",
   "Who is my onboarding buddy?", "What if I'm running behind?".
   Laptop answer: "You'll pick up your laptop and badge your first morning at the office. IT sets
   it up for you. Nothing needed from you until Monday."

## Chloe's data (35 min remaining, 2 of 8 done = 25%)
Done (2): Sign your offer letter; Consent to background check.
Quick start (2 min): Confirm your name and contact details (2 min, unblocks IT, DO THIS FIRST,
  due today). Legal name, preferred name, phone. Why-line: "So IT can create your BrightPath
  email and accounts."
Paperwork (20 min): Complete I-9 and W-4 (15 min, due Sunday); Set up direct deposit (5, Sunday).
Get connected (13 min): Accept your Slack invite (5, Sunday, has 4 steps: 1. Open the invite in
  your email, 2. Pick your name and photo, 3. Join #general and #engineering, 4. Say hi in
  #welcome); Read your day-1 welcome guide (5, Sunday); Request access to the production repo
  (3, Sunday, creates an approval request when completed).
Waiting (not counted in 2 of 8): Your BrightPath accounts (owner IT, ready Monday morning).
  Completing "Confirm your name and contact details" updates this row to "IT has what it needs
  and is setting these up."
"Do this first" rule: tasks that unblock someone else first, then earliest due, then group order.
All dates are OFFSETS from start date (never hardcode calendar dates).

## Later phases
Day 1 (pick up laptop and badge, meet your manager, meet your onboarding buddy, security
training), Week 1 (engineering: GitHub access, local dev environment, clone repos and run the app,
architecture overview, handbook, compliance training), First month (30-day check-in, ship first
small PR, give feedback on onboarding). Hidden until their date. Demo button "Jump to Monday"
advances time; then the same one-card + 3-stops UI shows Day 1 / Week 1 / First month tasks.
Finished phases disappear.

## Chloe's states
- A. Task completed: card slides away, plant grows.
- B. Stop completed: gentle moment "Quick start done! Next: Paperwork".
- C. All pre-start tasks done: full-bloom plant, "You're all set for Monday! 🌱", sub "Nothing left
  before day 1. Take a breath.", one "Next up: Monday 9:30, meet your manager" card. Waiting items
  stay in the footer. Page otherwise empty.
- D. Nothing due today but later tasks exist: small sprout, "You're all caught up for today.
  Next due: Sunday."
- E. Fully onboarded: nearly empty page, "You're fully onboarded 🌱", small "Share feedback" link.
- F. Overdue: gentle amber "Was due Saturday. No worries, it only takes 5 min."
- G. Start date moved: soft banner "Your start date moved to Tuesday. We updated your deadlines."
- H. Approval declined: tracker shows "Needs a change" with Mateo's note and "Fix and resubmit".
- I. Zero tasks: friendly "Your plan is being prepared" state, no crash.

## Approval flow (THE demo moment)
Chloe completes "Request access to the production repo" -> an AccessRequest is created
(requested -> waitingOnManager). It appears in Mateo's "Needs you" strip. Mateo clicks Approve
(or Decline with a reason). Chloe's tracker updates to Approved, then Ready (simulated IT).
State is shared between both views via localStorage, so toggling "View as" shows it live.

## Mateo's page (one page, same style)
1. Header: "Good morning, Mateo 🌱" (serif name). Subline: "1 thing needs you."
2. "Needs you" strip (only when needed): slim amber-tinted banner, one item, one button.
   "Chloe is waiting on your approval: production repo access" with Approve and a quiet Decline
   link. If several, show the first plus a "+1 more" chip.
3. "Your garden": one card per new hire with a plant matching status, name, role, start info,
   tiny % number, one short status line, one "Check in" button. Most attention first.
   - Priya Nair, Senior engineer, started 3 days ago, 62%, drooping sprout with amber dot,
     "Blocked: waiting on GitHub access, 3 days."
   - Jordan Lee, Product engineer, starts in 2 days, 0%, bare seed, "Hasn't started yet."
   - Chloe Zhang, Software engineer, starts Monday, 25%, healthy sprout, "On track."
4. "Check in" expands the card IN PLACE: one plain line, ONE action fitted to the situation (Nudge
   IT for blocked, Send a reminder for not started, Approve for approval, none for on track), and a
   collapsed "See all tasks" with owner, status, due (blocked item in amber).
5. States: after Nudge IT the button becomes "Nudged IT just now ✓" plus toast; after Approve the
   strip disappears with toast "Approved. Chloe has been notified."; nothing needs him ->
   "Nothing needs you right now 🌱"; a finished hire blooms then fades from the garden; empty
   garden "No new hires right now."
Visual note: Mateo's mockup is a first pass. Make it simpler and softer than the white-card grid:
less boxy, more open, same typography and palette as Chloe's page.

## Tech
Vite + React + TypeScript + Tailwind v4. No backend. Persist to localStorage. React context for
state. generatePlan(role, startDate) with Engineering (full) and Design (smaller, different tasks)
templates, to prove role-based plans. Plants: hand-built inline SVGs, no image assets.
Tiny "Demo controls" footer: Jump to Monday, Reset data (REQUIRED). Works at phone width.
Wrap localStorage reads in try/catch and reset on corrupt data.

## Assumptions (say these in the demo)
- BrightPath has an office; laptops are handed out on day 1, not shipped.
- Chloe opens the page Friday evening, 3 days before a Monday start.
- Role -> task template; dates are offsets from start date.
- Only "before day 1" is required now; everything else is peek-ahead and appears by date.
- Chatbot is canned answers. A real version would use an LLM over HR docs and policies.
- Mateo approves access; IT provisions after (IT has no UI).
- The page is temporary: it shrinks to nothing at day 30.

## Out of scope (mention, don't build)
Real auth, real email/notifications, template builder for Sarah, dev access tracker table,
live AI chatbot, IT provisioning integration, native mobile app.

## Questions for the customer
Remote, hybrid, or in-office? Who owns each access approval? How often do start dates move?
How does IT provision access today? Should managers get reminders sent for them? How should
Sarah edit templates? Is MangoApps' existing onboarding hub the system of record?

## Working rules
Build in small steps and commit after each. After each change, check the page in the browser, not
just the build. Test empty states, bad input, double clicks, refresh mid-flow, and Reset.
