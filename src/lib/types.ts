export type Step = {
  id: string;
  title: string;
  done: boolean;
  width?: number;
};

export type Task = {
  id: string;
  number: number;
  title: string;
  notes: string;
  owner: string;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
};

export type WidgetKind = "timer" | "links" | "today" | "shortcuts" | "activity";

export type FilterId = "active" | "done" | "all";

export type TimerState = {
  taskId: string | null;
  durationSec: number;
  remainingSec: number;
  running: boolean;
  endsAt: number | null;
};

export type ActivityEvent = {
  id: string;
  taskId: string;
  taskTitle: string;
  stepTitle: string;
  at: number;
};

export type QuickLink = {
  id: string;
  label: string;
  href: string;
  mark: string;
};

export const WIDGET_CATALOG: { kind: WidgetKind; label: string; blurb: string }[] = [
  { kind: "timer", label: "Focus timer", blurb: "Pinned to the bottom of the desk, up to 60 minutes" },
  { kind: "links", label: "Quick links", blurb: "Slack, Drive, Notion, Claude" },
  { kind: "today", label: "Today", blurb: "Active vs done at a glance" },
  { kind: "shortcuts", label: "Shortcuts", blurb: "Keyboard cheat sheet" },
  { kind: "activity", label: "Activity", blurb: "Recent step completions" },
];
