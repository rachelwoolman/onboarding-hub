import type { Owner, PhaseId, PortalHandoff, Role, TaskKind } from './types'

/**
 * Role-based onboarding templates. In a real product Sarah (HR) would edit these.
 * Every date is an offset in days from the start date; nothing is a calendar date.
 */

export interface TaskTemplate {
  key: string
  /** Done outside this page before it existed (e.g. signed with the offer). */
  external?: boolean
  kind?: TaskKind
  portal?: PortalHandoff
  title: string
  short: string
  why: string
  minutes: number
  dueOffset: number
  unblocks?: string
  steps?: string[]
  approval?: { resource: string }
  handoff?: { key: string; title: string; owner: Owner; readyAfterDays: number }
}

export interface StopTemplate {
  name: string
  tasks: TaskTemplate[]
}

export interface PhaseTemplate {
  id: PhaseId
  label: string
  /** Day (offset from start) the phase becomes visible. */
  opensOn: number
  stops: [StopTemplate, StopTemplate, StopTemplate]
}

export interface WaitingTemplate {
  key: string
  title: string
  owner: Owner
  readyOffset: number
  detail: string
  detailUnblocked?: string
  unblockedBy?: string
}

export interface RoleTemplate {
  role: Role
  phases: PhaseTemplate[]
  waiting: WaitingTemplate[]
}

// Shared tasks -------------------------------------------------------------

const confirmDetails: TaskTemplate = {
  key: 'confirm-details',
  kind: 'form',
  title: 'Confirm your name and contact details',
  short: 'Your details',
  why: 'So IT can create your BrightPath email and accounts.',
  minutes: 2,
  dueOffset: -3,
  unblocks: 'IT',
}

const offerLetter: TaskTemplate = {
  key: 'offer-letter',
  external: true,
  title: 'Sign your offer letter',
  short: 'Offer letter',
  why: 'Makes it official.',
  minutes: 5,
  dueOffset: -7,
}

const backgroundCheck: TaskTemplate = {
  key: 'background-check',
  external: true,
  title: 'Consent to background check',
  short: 'Background check',
  why: 'A standard step for everyone who joins.',
  minutes: 3,
  dueOffset: -7,
}

// Sensitive paperwork is handed off to BrightPath's secure HR portal, never collected here.
const i9w4: TaskTemplate = {
  key: 'i9-w4',
  kind: 'handoff',
  title: 'Complete I-9 and W-4',
  short: 'I-9 and W-4',
  why: 'Confirms you can work in the U.S. and sets up your tax withholding.',
  portal: {
    formName: 'Form I-9 and W-4',
    haveReady: ['Your home address', 'Your Social Security number', 'Your filing status and number of dependents'],
  },
  minutes: 15,
  dueOffset: -1,
}

/**
 * Four one-line confirmations instead of an article to read.
 * `{day}` and `{manager}` are filled in when shown, so they follow a moved start date.
 */
const mondayCheck: TaskTemplate = {
  key: 'monday-check',
  kind: 'steps',
  title: 'Your {day} sanity check',
  short: '{day} check',
  why: 'Four quick things so {day} morning is easy.',
  minutes: 1,
  dueOffset: -1,
  steps: [
    'Arrive 9:15 at 240 Fern Street, 4th floor',
    '{manager} meets you at the front desk at 9:30',
    'Pick up your badge and laptop there (bring ID)',
    'Free visitor parking on Alder Lane',
  ],
}

function slackInvite(teamChannel: string): TaskTemplate {
  return {
    key: 'slack-invite',
    kind: 'steps',
    title: 'Accept your Slack invite',
    short: 'Slack invite',
    why: 'Your team says hi here first.',
    minutes: 5,
    dueOffset: -1,
    steps: [
      'Open the invite in your email',
      'Pick your name and photo',
      `Join #general and #${teamChannel}`,
      'Say hi in #welcome',
    ],
  }
}

const accountsWaiting: WaitingTemplate = {
  key: 'accounts',
  title: 'Your BrightPath accounts',
  owner: 'IT',
  readyOffset: 0,
  detail: 'IT is setting these up, ready {day} morning.',
  detailUnblocked: 'IT has what it needs and is setting these up.',
  unblockedBy: 'confirm-details',
}

const day1Common = {
  laptop: {
    key: 'laptop-badge',
    title: 'Pick up your laptop and badge',
    short: 'Laptop and badge',
    why: 'IT has it set up and waiting for you at the front desk.',
    minutes: 15,
    dueOffset: 0,
  },
  manager: {
    key: 'meet-manager',
    title: 'Meet your manager',
    short: 'Meet your manager',
    why: 'A relaxed 30 minutes to talk about your first weeks.',
    minutes: 30,
    dueOffset: 0,
  },
  buddy: {
    key: 'meet-buddy',
    title: 'Meet your onboarding buddy',
    short: 'Meet your buddy',
    why: 'Your go-to person for every small question.',
    minutes: 20,
    dueOffset: 0,
  },
  security: {
    key: 'security-training',
    title: 'Complete security training',
    short: 'Security training',
    why: 'Keeps you and our customers’ health data safe.',
    minutes: 20,
    dueOffset: 0,
  },
} satisfies Record<string, TaskTemplate>

const feedback: TaskTemplate = {
  key: 'onboarding-feedback',
  title: 'Give feedback on your onboarding',
  short: 'Share feedback',
  why: 'Helps the next person start even smoother.',
  minutes: 5,
  dueOffset: 30,
}

const checkIn30: TaskTemplate = {
  key: 'check-in-30',
  title: 'Have your 30-day check-in',
  short: '30-day check-in',
  why: 'A chance to look back and plan ahead with your manager.',
  minutes: 30,
  dueOffset: 30,
}

// Engineering (full) -----------------------------------------------------------

const engineering: RoleTemplate = {
  role: 'Engineering',
  waiting: [accountsWaiting],
  phases: [
    {
      id: 'preStart',
      label: 'Before day 1',
      opensOn: -Infinity,
      stops: [
        { name: 'Quick start', tasks: [confirmDetails] },
        { name: 'Paperwork', tasks: [offerLetter, backgroundCheck, i9w4] },
        {
          name: 'Get connected',
          tasks: [
            slackInvite('engineering'),
            mondayCheck,
            {
              key: 'repo-access',
  kind: 'request',
              title: 'Request access to the production repo',
              short: 'Repo access',
              why: 'Your manager approves it, so it’s ready when you need it.',
              minutes: 3,
              dueOffset: -1,
              approval: { resource: 'production repo' },
            },
          ],
        },
      ],
    },
    {
      id: 'day1',
      label: 'Day 1',
      opensOn: 0,
      stops: [
        { name: 'Arrive', tasks: [day1Common.laptop] },
        { name: 'Meet people', tasks: [day1Common.manager, day1Common.buddy] },
        { name: 'Stay safe', tasks: [day1Common.security] },
      ],
    },
    {
      id: 'week1',
      label: 'Week 1',
      opensOn: 1,
      stops: [
        {
          name: 'Access',
          tasks: [
            {
              key: 'github-access',
              title: 'Request GitHub access',
              short: 'GitHub access',
              why: 'IT adds you to the BrightPath org.',
              minutes: 2,
              dueOffset: 1,
              handoff: { key: 'github', title: 'GitHub access', owner: 'IT', readyAfterDays: 1 },
            },
          ],
        },
        {
          name: 'Set up',
          tasks: [
            {
              key: 'local-dev',
              title: 'Set up your local dev environment',
              short: 'Dev environment',
              why: 'The setup script does most of the work.',
              minutes: 45,
              dueOffset: 2,
            },
            {
              key: 'run-app',
              title: 'Clone the repos and run the app',
              short: 'Run the app',
              why: 'Seeing it run locally makes everything click.',
              minutes: 30,
              dueOffset: 3,
            },
          ],
        },
        {
          name: 'Learn',
          tasks: [
            {
              key: 'architecture',
              title: 'Watch the architecture overview',
              short: 'Architecture',
              why: 'A 20-minute map of how the pieces fit.',
              minutes: 20,
              dueOffset: 4,
            },
            {
              key: 'handbook',
              title: 'Skim the engineering handbook',
              short: 'Handbook',
              why: 'How we review, ship and stay on call.',
              minutes: 15,
              dueOffset: 4,
            },
            {
              key: 'compliance',
              title: 'Complete compliance training',
              short: 'Compliance',
              why: 'Required for anyone who touches health data.',
              minutes: 30,
              dueOffset: 4,
            },
          ],
        },
      ],
    },
    {
      id: 'month1',
      label: 'First month',
      opensOn: 7,
      stops: [
        {
          name: 'Ship',
          tasks: [
            {
              key: 'first-pr',
              title: 'Ship your first small PR',
              short: 'First PR',
              why: 'Small is perfect. Your buddy can help pick one.',
              minutes: 60,
              dueOffset: 14,
            },
          ],
        },
        { name: 'Check in', tasks: [checkIn30] },
        { name: 'Reflect', tasks: [feedback] },
      ],
    },
  ],
}

// Design (smaller, different) --------------------------------------------------

const design: RoleTemplate = {
  role: 'Design',
  waiting: [accountsWaiting],
  phases: [
    {
      id: 'preStart',
      label: 'Before day 1',
      opensOn: -Infinity,
      stops: [
        { name: 'Quick start', tasks: [confirmDetails] },
        { name: 'Paperwork', tasks: [offerLetter, i9w4] },
        {
          name: 'Get connected',
          tasks: [
            slackInvite('design'),
            mondayCheck,
            {
              key: 'figma-access',
  kind: 'request',
              title: 'Request a Figma seat',
              short: 'Figma seat',
              why: 'Your manager approves it, so it’s ready on day 1.',
              minutes: 2,
              dueOffset: -1,
              approval: { resource: 'Figma team' },
            },
          ],
        },
      ],
    },
    {
      id: 'day1',
      label: 'Day 1',
      opensOn: 0,
      stops: [
        { name: 'Arrive', tasks: [day1Common.laptop] },
        { name: 'Meet people', tasks: [day1Common.manager] },
        { name: 'Stay safe', tasks: [day1Common.security] },
      ],
    },
    {
      id: 'week1',
      label: 'Week 1',
      opensOn: 1,
      stops: [
        {
          name: 'Explore',
          tasks: [
            {
              key: 'design-system',
              title: 'Walk through the design system',
              short: 'Design system',
              why: 'Our components, tokens and the why behind them.',
              minutes: 30,
              dueOffset: 2,
            },
          ],
        },
        {
          name: 'Meet',
          tasks: [
            {
              key: 'meet-pms',
              title: 'Meet your product partners',
              short: 'Meet PMs',
              why: 'The people you’ll shape features with.',
              minutes: 30,
              dueOffset: 3,
            },
          ],
        },
        {
          name: 'Listen',
          tasks: [
            {
              key: 'research-library',
              title: 'Watch two patient interviews',
              short: 'Patient interviews',
              why: 'The fastest way to understand who we design for.',
              minutes: 40,
              dueOffset: 4,
            },
          ],
        },
      ],
    },
    {
      id: 'month1',
      label: 'First month',
      opensOn: 7,
      stops: [
        {
          name: 'Ship',
          tasks: [
            {
              key: 'first-critique',
              title: 'Share work at your first critique',
              short: 'First critique',
              why: 'Early and rough is exactly right.',
              minutes: 30,
              dueOffset: 14,
            },
          ],
        },
        { name: 'Check in', tasks: [checkIn30] },
        { name: 'Reflect', tasks: [feedback] },
      ],
    },
  ],
}

export const TEMPLATES: Record<Role, RoleTemplate> = {
  Engineering: engineering,
  Design: design,
}

export const PHASE_ORDER: PhaseId[] = ['preStart', 'day1', 'week1', 'month1']

export function phaseTemplate(role: Role, phase: PhaseId): PhaseTemplate {
  const found = TEMPLATES[role].phases.find((p) => p.id === phase)
  if (!found) throw new Error(`No ${phase} phase for ${role}`)
  return found
}
