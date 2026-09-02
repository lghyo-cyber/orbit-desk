import type { ActivityEvent, QuickLink, Task, WidgetKind } from "./types";

const now = Date.now();
const hours = (n: number) => now - n * 60 * 60 * 1000;

export const SEED_TASKS: Task[] = [
  {
    id: "orb-14",
    number: 14,
    title: "Onboarding redesign",
    owner: "LG",
    notes:
      "Does mobile get a separate flow, or do we gate it behind a flag?\n\nCheck with Min on analytics — `signup_view` still fires twice on the password step.\n\nExtra: pull the empty-state illustration from the brand kit before handoff.",
    steps: [
      { id: "o1", title: "Audit current flow", done: true },
      { id: "o2", title: "Draft wireframes", done: true },
      { id: "o3", title: "High-fidelity screens", done: false },
      { id: "o4", title: "Eng handoff", done: false },
      { id: "o5", title: "QA pass", done: false },
    ],
    createdAt: hours(72),
    updatedAt: hours(2),
  },
  {
    id: "orb-21",
    number: 21,
    title: "API rate limiter",
    owner: "JK",
    notes:
      "Question: per-token or per-IP for anonymous traffic?\n\nNeed a burst of 20 then 5 rps steady. Staging already has Redis — reuse that, don't add a new store.",
    steps: [
      { id: "r1", title: "Write spec", done: true },
      { id: "r2", title: "Implement middleware", done: false },
      { id: "r3", title: "Add tests", done: false },
      { id: "r4", title: "Ship behind flag", done: false },
    ],
    createdAt: hours(40),
    updatedAt: hours(5),
  },
  {
    id: "orb-22",
    number: 22,
    title: "Payment webhook retries",
    owner: "MN",
    notes:
      "Stripe `invoice.paid` dropped twice last week. Confirm we still ack 200 before processing.\n\nFollow-up: dead-letter queue into Slack #payments.",
    steps: [
      { id: "p1", title: "Reproduce failure", done: true },
      { id: "p2", title: "Design retry policy", done: false },
      { id: "p3", title: "Implement", done: false },
      { id: "p4", title: "Verify in staging", done: false },
    ],
    createdAt: hours(30),
    updatedAt: hours(8),
  },
  {
    id: "orb-18",
    number: 18,
    title: "Q3 OKR review",
    owner: "LG",
    notes: "Need North-star number from finance by Thursday.\n\nOpen question: do we keep the activation OKR or replace it with retention?",
    steps: [
      { id: "q1", title: "Pull metrics", done: false },
      { id: "q2", title: "Draft narrative", done: false },
      { id: "q3", title: "Share with leads", done: false },
    ],
    createdAt: hours(20),
    updatedAt: hours(20),
  },
  {
    id: "orb-9",
    number: 9,
    title: "Incident postmortem — auth latency",
    owner: "JK",
    notes: "Root cause was the session cache stampede. Action items live in this list so they don't vanish into the doc.",
    steps: [
      { id: "i1", title: "Timeline of events", done: true },
      { id: "i2", title: "Root-cause writeup", done: true },
      { id: "i3", title: "Action items assigned", done: false },
    ],
    createdAt: hours(96),
    updatedAt: hours(12),
  },
  {
    id: "orb-7",
    number: 7,
    title: "Design tokens v2",
    owner: "MN",
    notes: "Shipped. Residual: archive the old Figma library next week.",
    steps: [
      { id: "d1", title: "Inventory current tokens", done: true },
      { id: "d2", title: "Propose scale", done: true },
      { id: "d3", title: "Migrate Figma", done: true },
      { id: "d4", title: "Roll out to app", done: true },
    ],
    createdAt: hours(200),
    updatedAt: hours(28),
  },
];

export const SEED_EVENTS: ActivityEvent[] = [
  {
    id: "ev1",
    taskId: "orb-14",
    taskTitle: "Onboarding redesign",
    stepTitle: "Draft wireframes",
    at: hours(2),
  },
  {
    id: "ev2",
    taskId: "orb-21",
    taskTitle: "API rate limiter",
    stepTitle: "Write spec",
    at: hours(5),
  },
  {
    id: "ev3",
    taskId: "orb-9",
    taskTitle: "Incident postmortem — auth latency",
    stepTitle: "Root-cause writeup",
    at: hours(12),
  },
  {
    id: "ev4",
    taskId: "orb-7",
    taskTitle: "Design tokens v2",
    stepTitle: "Roll out to app",
    at: hours(28),
  },
];

export const SEED_LINKS: QuickLink[] = [
  { id: "slack", label: "Slack", href: "https://app.slack.com", mark: "Sl" },
  { id: "drive", label: "Drive", href: "https://drive.google.com", mark: "Dr" },
  { id: "notion", label: "Notion", href: "https://www.notion.so", mark: "No" },
  { id: "claude", label: "Claude", href: "https://claude.ai", mark: "Cl" },
];

export const SEED_WIDGETS: WidgetKind[] = ["timer", "links", "today"];
