"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_TOPICS } from "./seed";
import type { Step, Topic } from "./types";
import { uid } from "./utils";

export function currentStep(topic: Topic): Step | null {
  return topic.steps.find((s) => !s.done) ?? null;
}

export function isFinished(topic: Topic): boolean {
  return topic.steps.length > 0 && topic.steps.every((s) => s.done);
}

type PadState = {
  topics: Topic[];
  selectedId: string | null;
  select: (id: string | null) => void;
  addTopic: () => string;
  updateTopic: (id: string, patch: Partial<Pick<Topic, "title" | "notes">>) => void;
  removeTopic: (id: string) => void;
  addStep: (topicId: string, title: string) => void;
  updateStep: (topicId: string, stepId: string, title: string) => void;
  removeStep: (topicId: string, stepId: string) => void;
  completeCurrent: (topicId: string) => void;
  uncompleteStep: (topicId: string, stepId: string) => void;
};

function touch(topic: Topic): Topic {
  return { ...topic, updatedAt: Date.now() };
}

export const usePadStore = create<PadState>()(
  persist(
    (set, get) => ({
      topics: SEED_TOPICS,
      selectedId: "t-onboard",
      select: (id) => set({ selectedId: id }),
      addTopic: () => {
        const id = uid("t");
        const topic: Topic = {
          id,
          title: "",
          notes: "",
          steps: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ topics: [...s.topics, topic], selectedId: id }));
        return id;
      },
      updateTopic: (id, patch) =>
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t)),
        })),
      removeTopic: (id) =>
        set((s) => ({
          topics: s.topics.filter((t) => t.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      addStep: (topicId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId
              ? touch({
                  ...t,
                  steps: [...t.steps, { id: uid("s"), title: trimmed, done: false }],
                })
              : t,
          ),
        }));
      },
      updateStep: (topicId, stepId, title) =>
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === stepId ? { ...st, title } : st)),
                })
              : t,
          ),
        })),
      removeStep: (topicId, stepId) =>
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId ? touch({ ...t, steps: t.steps.filter((st) => st.id !== stepId) }) : t,
          ),
        })),
      completeCurrent: (topicId) => {
        const topic = get().topics.find((t) => t.id === topicId);
        const step = topic ? currentStep(topic) : null;
        if (!step) return;
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === step.id ? { ...st, done: true } : st)),
                })
              : t,
          ),
        }));
      },
      uncompleteStep: (topicId, stepId) =>
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === stepId ? { ...st, done: false } : st)),
                })
              : t,
          ),
        })),
    }),
    {
      name: "pad-sheet-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
