import type { Owner, PhaseId, PortalHandoff, Role, TaskKind } from './types'

/**
 * Role-based onboarding templates. In a real product Sarah (HR) would edit these.
 * Every date is an offset in days from the start date; nothing is a calendar date.
 * Copy may use `{day}` (weekday of day 1) and `{manager}`; they're filled when shown.
 */

export interface TaskTemplate {
  key: string
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

/** One line of the first-day itinerary shown in "Coming up" before day 1. */
export interface AgendaItem {
  time: string
  text: string
  /** Set when someone else does it (e.g. IT gets accounts ready). */
  owner?: Owner
}

export interface PhaseTemplate {
  id: PhaseId
  label: string
  /** Day (offset from start) the phase becomes visible. */
  opensOn: number
  stops: [StopTemplate, StopTemplate, StopTemplate]
  /** Day 1 only: the timed itinerary and a small footnote. */
  agenda?: { items: AgendaItem[]; footnote?: string }
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

const day1 = {
  manager: {
    key: 'meet-manager',
    title: 'Meet {manager} at the front desk',
    short: 'Meet {manager}',
    why: 'A relaxed start to talk about your first weeks.',
    minutes: 30,
    dueOffset: 0,
  },
  laptop: {
    key: 'laptop-badge',
    title: 'Pick up your badge and laptop',
    short: 'Badge and laptop',
    why: 'IT has it set up and waiting for you. Bring your ID.',
    minutes: 15,
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
  buddy: {
    key: 'meet-buddy',
    title: 'Have lunch with your onboarding buddy',
    short: 'Lunch with your buddy',
    why: 'Your go-to person for every small question.',
    minutes: 45,
    dueOffset: 0,
  },
} satisfies Record<string, TaskTemplate>

const checkIn30: TaskTemplate = {
  key: 'check-in-30',
  title: '30-day check-in with {manager}',
  short: '30-day check-in',
  why: 'A chance to look back and plan ahead together.',
  minutes: 30,
  dueOffset: 30,
}

const feedback: TaskTemplate = {
  key: 'onboarding-feedback',
  title: 'Share feedback on onboarding',
  short: 'Share feedback',
  why: 'Helps the next person start even smoother.',
  minutes: 5,
  dueOffset: 30,
}

const ARRIVE = { time: '9:15', text: 'Arrive at 240 Fern Street, 4th floor' }
const PARKING = 'Free visitor parking on Alder Lane.'

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
        { name: 'Paperwork', tasks: [i9w4] },
        {
          name: 'Get connected',
          tasks: [
            slackInvite('engineering'),
            {
              key: 'code-access',
              kind: 'request',
              title: 'Get access to your team’s code',
              short: 'Code access',
              why: '{manager} approves it, so you can push code on day one.',
              minutes: 3,
              dueOffset: -1,
              approval: { resource: 'Code access' },
            },
          ],
        },
      ],
    },
    {
      id: 'day1',
      label: 'Day 1',
      opensOn: 0,
      // Day 1 tasks run in the same order as the itinerary below.
      stops: [
        { name: 'Arrive', tasks: [day1.manager, day1.laptop] },
        { name: 'Get set up', tasks: [day1.security] },
        { name: 'Meet people', tasks: [day1.buddy] },
      ],
      agenda: {
        items: [
          ARRIVE,
          { time: '9:30', text: 'Meet {manager} at the front desk' },
          { time: '10:00', text: 'Pick up your badge and laptop (bring ID)' },
          { time: '10:30', text: 'Your BrightPath accounts are ready', owner: 'IT' },
          { time: '11:00', text: 'Security training, 20 min' },
          { time: '12:30', text: 'Lunch with your onboarding buddy' },
        ],
        footnote: PARKING,
      },
    },
    {
      id: 'week1',
      label: 'Week 1',
      opensOn: 1,
      stops: [
        {
          name: 'Set up',
          tasks: [
            {
              key: 'local-dev',
              title: 'Set up your dev environment',
              short: 'Dev environment',
              why: 'The setup script does most of the work.',
              minutes: 45,
              dueOffset: 1,
            },
            {
              key: 'run-app',
              title: 'Clone the repos and run the app',
              short: 'Run the app',
              why: 'Seeing it run locally makes everything click.',
              minutes: 30,
              dueOffset: 2,
            },
          ],
        },
        {
          name: 'Learn',
          tasks: [
            {
              key: 'architecture',
              title: 'Read the architecture overview',
              short: 'Architecture',
              why: 'A short map of how the pieces fit.',
              minutes: 20,
              dueOffset: 3,
            },
            {
              key: 'handbook',
              title: 'Review the employee handbook',
              short: 'Handbook',
              why: 'How we work, take time off and stay safe.',
              minutes: 15,
              dueOffset: 4,
            },
          ],
        },
        {
          name: 'Stay compliant',
          tasks: [
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
        { name: 'Check in', tasks: [checkIn30] },
        {
          name: 'Ship',
          tasks: [
            {
              key: 'first-pr',
              title: 'Ship your first small pull request',
              short: 'First PR',
              why: 'Small is perfect. Your buddy can help pick one.',
              minutes: 60,
              dueOffset: 14,
            },
          ],
        },
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
        { name: 'Paperwork', tasks: [i9w4] },
        {
          name: 'Get connected',
          tasks: [
            slackInvite('design'),
            {
              key: 'figma-access',
              kind: 'request',
              title: 'Get a Figma seat',
              short: 'Figma seat',
              why: '{manager} approves it, so it’s ready on day 1.',
              minutes: 2,
              dueOffset: -1,
              approval: { resource: 'Figma access' },
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
        { name: 'Arrive', tasks: [day1.manager, day1.laptop] },
        { name: 'Get set up', tasks: [day1.security] },
        {
          name: 'Meet people',
          tasks: [
            {
              key: 'design-lunch',
              title: 'Lunch with the design team',
              short: 'Design team lunch',
              why: 'Meet the people you’ll critique and create with.',
              minutes: 60,
              dueOffset: 0,
            },
          ],
        },
      ],
      agenda: {
        items: [
          ARRIVE,
          { time: '9:30', text: 'Meet {manager} at the front desk' },
          { time: '10:00', text: 'Pick up your badge and laptop (bring ID)' },
          { time: '10:30', text: 'Your Figma and BrightPath accounts are ready', owner: 'IT' },
          { time: '11:00', text: 'Security training, 20 min' },
          { time: '12:30', text: 'Lunch with the design team' },
        ],
        footnote: PARKING,
      },
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
        { name: 'Check in', tasks: [checkIn30] },
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
