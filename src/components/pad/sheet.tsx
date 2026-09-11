"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { currentStep, isFinished, usePadStore } from "@/lib/store";
import type { Step, Topic } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PadApp() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    try {
      void Promise.resolve(usePadStore.persist.rehydrate()).then(done, done);
    } catch {
      done();
    }
    const t = window.setTimeout(done, 120);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);
  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-linen p-6">
        <div className="sheet h-[min(720px,90dvh)] w-full max-w-xl rounded-[28px]" />
      </main>
    );
  }
  return <Sheet />;
}

function Sheet() {
  const topics = usePadStore((s) => s.topics);
  const addTopic = usePadStore((s) => s.addTopic);
  const selectedId = usePadStore((s) => s.selectedId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "k" || e.key === "1") {
        e.preventDefault();
        const id = addTopic();
        window.dispatchEvent(new CustomEvent("pad:focus-title", { detail: id }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addTopic]);

  return (
    <main className="min-h-dvh bg-linen px-4 py-8 sm:px-8 sm:py-12">
      <article className="sheet mx-auto w-full max-w-xl rounded-[28px] px-6 py-7 sm:px-9 sm:py-9">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Pad</h1>
            <p className="text-sm text-muted">한 장에, 한눈에</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const id = addTopic();
              window.dispatchEvent(new CustomEvent("pad:focus-title", { detail: id }));
            }}
            className="flex size-11 items-center justify-center rounded-full text-muted transition-transform duration-150 ease-out hover:bg-ink/5 hover:text-ink active:scale-[0.96]"
            aria-label="주제 추가"
          >
            <Plus className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex flex-col gap-8">
          {topics.map((topic) => (
            <TopicBlock key={topic.id} topic={topic} selected={topic.id === selectedId} />
          ))}
        </div>

        {topics.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            오른쪽 위 + 또는 Ctrl 1 로 주제를 넣으세요
          </p>
        )}
      </article>
    </main>
  );
}

function TopicBlock({ topic, selected }: { topic: Topic; selected: boolean }) {
  const select = usePadStore((s) => s.select);
  const updateTopic = usePadStore((s) => s.updateTopic);
  const removeTopic = usePadStore((s) => s.removeTopic);
  const addStep = usePadStore((s) => s.addStep);
  const updateStep = usePadStore((s) => s.updateStep);
  const removeStep = usePadStore((s) => s.removeStep);
  const completeCurrent = usePadStore((s) => s.completeCurrent);
  const uncompleteStep = usePadStore((s) => s.uncompleteStep);

  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const current = currentStep(topic);
  const done = isFinished(topic);

  useEffect(() => {
    function onFocus(e: Event) {
      if ((e as CustomEvent<string>).detail === topic.id) {
        titleRef.current?.focus();
      }
    }
    window.addEventListener("pad:focus-title", onFocus);
    return () => window.removeEventListener("pad:focus-title", onFocus);
  }, [topic.id]);

  function onStepToggle(step: Step) {
    if (step.done) {
      uncompleteStep(topic.id, step.id);
      return;
    }
    if (current && step.id === current.id) completeCurrent(topic.id);
  }

  function commitStep() {
    const title = draft.replace(/\s+/g, " ").trim();
    if (!title) return;
    addStep(topic.id, title);
    setDraft("");
  }

  return (
    <section
      onClick={() => select(topic.id)}
      className={cn("group/topic relative", done && "opacity-55")}
    >
      <div className="flex items-start gap-3">
        <TopicDot filled={done} active={selected && !done} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              ref={titleRef}
              value={topic.title}
              placeholder="주제"
              onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-base font-medium tracking-tight text-ink outline-none placeholder:text-faint"
            />
            <button
              type="button"
              aria-label="주제 삭제"
              onClick={(e) => {
                e.stopPropagation();
                removeTopic(topic.id);
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-faint opacity-0 transition-opacity group-hover/topic:opacity-100 hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Wave className="w-14 shrink-0 text-muted" />
            <input
              value={topic.notes}
              placeholder="내용"
              onChange={(e) => updateTopic(topic.id, { notes: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-sm text-muted outline-none placeholder:text-faint"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {topic.steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStepToggle(step);
                }}
                className={cn(
                  "group/step flex h-8 max-w-full items-center gap-1.5 rounded-[10px] px-2.5",
                  "shadow-[0_0_0_1px_var(--color-line)]",
                  "transition-transform duration-150 ease-out active:scale-[0.96]",
                  step.done && "bg-ink/[0.06]",
                  current?.id === step.id && "shadow-[0_0_0_1px_var(--color-ink)]",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    step.done ? "bg-done" : "bg-faint",
                  )}
                />
                <input
                  value={step.title}
                  aria-label="단계"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateStep(topic.id, step.id, e.target.value)}
                  className={cn(
                    "min-w-8 max-w-48 bg-transparent text-sm text-ink outline-none [field-sizing:content]",
                    step.done && "text-muted",
                  )}
                />
                <span
                  role="button"
                  aria-label="단계 삭제"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStep(topic.id, step.id);
                  }}
                  className="flex size-5 items-center justify-center text-faint opacity-0 group-hover/step:opacity-100"
                >
                  <X className="size-3" />
                </span>
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitStep();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 min-w-28 items-center rounded-[10px] px-2.5 shadow-[0_0_0_1px_var(--color-line)]"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="단계"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicDot({ filled, active }: { filled: boolean; active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full",
        "shadow-[0_0_0_1.5px_var(--color-ink)]",
        filled && "bg-ink",
      )}
    >
      {active && !filled ? <span className="size-1.5 rounded-full bg-ink" /> : null}
    </span>
  );
}

function Wave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 10" className={className} aria-hidden>
      <path
        className="wave-path"
        d="M1 5 Q 5 1 9 5 T 17 5 T 25 5 T 33 5 T 41 5 T 49 5 T 55 5"
      />
    </svg>
  );
}
