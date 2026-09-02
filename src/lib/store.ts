"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_EVENTS, SEED_LINKS, SEED_TASKS, SEED_WIDGETS } from "./seed";
import type {
  ActivityEvent,
  FilterId,
  QuickLink,
  Task,
  TimerState,
  WidgetKind,
} from "./types";
import { uid, markFrom, normalizeHref } from "./utils";

export type OrbitState = {
  tasks: Task[];
  events: ActivityEvent[];
  links: QuickLink[];
  enabledWidgets: WidgetKind[];
  selectedTaskId: string | null;
  filter: FilterId;
  timer: TimerState;
  nextNumber: number;

  selectTask: (id: string | null) => void;
  setFilter: (filter: FilterId) => void;

  addTask: (title?: string) => string;
  updateTask: (id: string, patch: Partial<Pick<Task, "title" | "notes" | "owner">>) => void;
  removeTask: (id: string) => void;

  addStep: (taskId: string, title: string) => void;
  updateStepTitle: (taskId: string, stepId: string, title: string) => void;
  updateStepWidth: (taskId: string, stepId: string, width: number) => void;
  removeStep: (taskId: string, stepId: string) => void;
  reorderSteps: (taskId: string, orderedIds: string[]) => void;
  completeCurrentStep: (taskId: string) => void;
  uncompleteStep: (taskId: string, stepId: string) => void;

  toggleWidget: (kind: WidgetKind, on: boolean) => void;
  moveWidget: (kind: WidgetKind, dir: -1 | 1) => void;

  addLink: (label: string, href: string) => void;
  updateLink: (id: string, patch: Partial<Pick<QuickLink, "label" | "href">>) => void;
  removeLink: (id: string) => void;

  setTimerTask: (taskId: string | null) => void;
  setTimerMinutes: (minutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  finishTimer: () => void;
};

function touch(task: Task): Task {
  return { ...task, updatedAt: Date.now() };
}

function currentStep(task: Task) {
  return task.steps.find((s) => !s.done) ?? null;
}

function isComplete(task: Task) {
  return task.steps.length > 0 && task.steps.every((s) => s.done);
}

export { currentStep, isComplete };

export const useOrbitStore = create<OrbitState>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,
      events: SEED_EVENTS,
      links: SEED_LINKS,
      enabledWidgets: SEED_WIDGETS,
      selectedTaskId: "orb-14",
      filter: "active",
      nextNumber: 23,
      timer: {
        taskId: "orb-14",
        durationSec: 25 * 60,
        remainingSec: 25 * 60,
        running: false,
        endsAt: null,
      },

      selectTask: (id) => set({ selectedTaskId: id }),
      setFilter: (filter) => set({ filter }),

      addTask: (title = "") => {
        const id = uid("orb");
        const number = get().nextNumber;
        const task: Task = {
          id,
          number,
          title,
          notes: "",
          owner: "LG",
          steps: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          tasks: [task, ...s.tasks],
          selectedTaskId: id,
          nextNumber: number + 1,
          filter: "active",
          timer: s.timer.taskId ? s.timer : { ...s.timer, taskId: id },
        }));
        return id;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t)),
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
          timer:
            s.timer.taskId === id
              ? { ...s.timer, taskId: null, running: false, endsAt: null }
              : s.timer,
        })),

      addStep: (taskId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({
                  ...t,
                  steps: [...t.steps, { id: uid("st"), title: trimmed, done: false }],
                })
              : t,
          ),
        }));
      },

      updateStepTitle: (taskId, stepId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === stepId ? { ...st, title } : st)),
                })
              : t,
          ),
        })),

      updateStepWidth: (taskId, stepId, width) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  steps: t.steps.map((st) =>
                    st.id === stepId ? { ...st, width: Math.round(width) } : st,
                  ),
                }
              : t,
          ),
        })),

      removeStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({ ...t, steps: t.steps.filter((st) => st.id !== stepId) })
              : t,
          ),
        })),

      reorderSteps: (taskId, orderedIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const map = new Map(t.steps.map((st) => [st.id, st]));
            const next = orderedIds
              .map((id) => map.get(id))
              .filter((st): st is NonNullable<typeof st> => Boolean(st));
            for (const st of t.steps) {
              if (!orderedIds.includes(st.id)) next.push(st);
            }
            return touch({ ...t, steps: next });
          }),
        })),

      completeCurrentStep: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const step = currentStep(task);
        if (!step) return;
        const event: ActivityEvent = {
          id: uid("ev"),
          taskId,
          taskTitle: task.title || "Untitled",
          stepTitle: step.title,
          at: Date.now(),
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === step.id ? { ...st, done: true } : st)),
                })
              : t,
          ),
          events: [event, ...s.events].slice(0, 40),
        }));
      },

      uncompleteStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === stepId ? { ...st, done: false } : st)),
                })
              : t,
          ),
        })),

      toggleWidget: (kind, on) =>
        set((s) => {
          const has = s.enabledWidgets.includes(kind);
          if (on && !has) return { enabledWidgets: [...s.enabledWidgets, kind] };
          if (!on && has) return { enabledWidgets: s.enabledWidgets.filter((k) => k !== kind) };
          return s;
        }),

      moveWidget: (kind, dir) =>
        set((s) => {
          const i = s.enabledWidgets.indexOf(kind);
          if (i < 0) return s;
          const j = i + dir;
          if (j < 0 || j >= s.enabledWidgets.length) return s;
          const next = [...s.enabledWidgets];
          const a = next[i];
          const b = next[j];
          if (!a || !b) return s;
          next[i] = b;
          next[j] = a;
          return { enabledWidgets: next };
        }),

      addLink: (label, href) => {
        const l = label.trim();
        const h = normalizeHref(href);
        if (!l || !h) return;
        const link: QuickLink = {
          id: uid("lk"),
          label: l,
          href: h,
          mark: markFrom(l),
        };
        set((s) => ({ links: [...s.links, link] }));
      },

      updateLink: (id, patch) =>
        set((s) => ({
          links: s.links.map((lk) => {
            if (lk.id !== id) return lk;
            const label = patch.label !== undefined ? patch.label.trim() || lk.label : lk.label;
            const href = patch.href !== undefined ? normalizeHref(patch.href) || lk.href : lk.href;
            return { ...lk, label, href, mark: markFrom(label) };
          }),
        })),

      removeLink: (id) => set((s) => ({ links: s.links.filter((lk) => lk.id !== id) })),

      setTimerTask: (taskId) =>
        set((s) => ({
          timer: { ...s.timer, taskId },
          selectedTaskId: taskId ?? s.selectedTaskId,
        })),

      setTimerMinutes: (minutes) => {
        const durationSec = Math.min(60, Math.max(1, Math.round(minutes))) * 60;
        set((s) => ({
          timer: {
            ...s.timer,
            durationSec,
            remainingSec: s.timer.running ? s.timer.remainingSec : durationSec,
            running: false,
            endsAt: null,
          },
        }));
      },

      startTimer: () => {
        const { timer, selectedTaskId } = get();
        const taskId = timer.taskId ?? selectedTaskId;
        const remaining = timer.remainingSec > 0 ? timer.remainingSec : timer.durationSec;
        set({
          timer: {
            ...timer,
            taskId,
            remainingSec: remaining,
            running: remaining > 0,
            endsAt: remaining > 0 ? Date.now() + remaining * 1000 : null,
          },
        });
      },

      pauseTimer: () =>
        set((s) => {
          const remaining =
            s.timer.running && s.timer.endsAt
              ? Math.max(0, Math.round((s.timer.endsAt - Date.now()) / 1000))
              : s.timer.remainingSec;
          return {
            timer: { ...s.timer, running: false, remainingSec: remaining, endsAt: null },
          };
        }),

      resetTimer: () =>
        set((s) => ({
          timer: {
            ...s.timer,
            running: false,
            remainingSec: s.timer.durationSec,
            endsAt: null,
          },
        })),

      finishTimer: () =>
        set((s) => ({
          timer: {
            ...s.timer,
            running: false,
            remainingSec: 0,
            endsAt: null,
          },
        })),
    }),
    {
      name: "orbit-desk-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
    },
  ),
);
