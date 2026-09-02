"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, ArrowUp, ArrowDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { currentStep, isComplete, useOrbitStore } from "@/lib/store";
import { WIDGET_CATALOG, type WidgetKind } from "@/lib/types";
import { cn, formatTime, isSafeHttpUrl } from "@/lib/utils";

export function WidgetColumn() {
  const enabled = useOrbitStore((s) => s.enabledWidgets);
  const rail = enabled.filter((k) => k !== "timer");
  return (
    <aside className="flex flex-col gap-3">
      {rail.length === 0 ? (
        <div className="glass rounded-2xl p-5 text-ui text-muted">
          No widgets on the desk. Open Customize to add links or today.
        </div>
      ) : (
        rail.map((kind) => <WidgetFrame key={kind} kind={kind} />)
      )}
    </aside>
  );
}

function WidgetFrame({ kind }: { kind: WidgetKind }) {
  switch (kind) {
    case "timer":
      return null;
    case "links":
      return <LinksWidget />;
    case "today":
      return <TodayWidget />;
    case "shortcuts":
      return <ShortcutsWidget />;
    case "activity":
      return <ActivityWidget />;
  }
}

function WidgetShell({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-micro font-medium tracking-wider text-subtle uppercase">{label}</p>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TimerDock() {
  const on = useOrbitStore((s) => s.enabledWidgets.includes("timer"));
  if (!on) return null;
  return <TimerWidget />;
}

function TimerWidget() {
  const timer = useOrbitStore((s) => s.timer);
  const tasks = useOrbitStore((s) => s.tasks);
  const startTimer = useOrbitStore((s) => s.startTimer);
  const pauseTimer = useOrbitStore((s) => s.pauseTimer);
  const resetTimer = useOrbitStore((s) => s.resetTimer);
  const finishTimer = useOrbitStore((s) => s.finishTimer);
  const setTimerMinutes = useOrbitStore((s) => s.setTimerMinutes);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const remaining =
    timer.running && timer.endsAt
      ? Math.max(0, Math.round((timer.endsAt - now) / 1000))
      : timer.remainingSec;

  useEffect(() => {
    if (timer.running && remaining <= 0) finishTimer();
  }, [timer.running, remaining, finishTimer]);

  const task = tasks.find((t) => t.id === timer.taskId);
  const minutes = Math.round(timer.durationSec / 60);
  const frac = timer.durationSec > 0 ? remaining / timer.durationSec : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <section className="glass shrink-0 rounded-2xl px-4 py-2.5">
      <div className="flex items-center gap-4">
        <div className="relative size-12 shrink-0">
          <svg viewBox="0 0 56 56" className="size-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke="rgb(255 255 255 / 0.08)"
              strokeWidth="3"
            />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke={remaining === 0 ? "var(--color-lime)" : "var(--color-violet)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - frac)}
              className="transition-[stroke-dashoffset] duration-200 linear"
            />
          </svg>
        </div>
        <div className="min-w-0 w-44 shrink-0">
          <p className="font-mono text-xl font-medium tabular-nums tracking-tight text-fg">
            {formatTime(remaining)}
          </p>
          <p className="truncate text-micro text-muted">
            {task ? task.title || "Untitled" : "Select a task to focus"}
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTimerMinutes(m)}
              className={cn(
                "tap h-7 rounded-md px-2 text-micro font-medium tabular-nums",
                minutes === m ? "bg-violet/20 text-fg" : "text-muted hover:bg-fg/6 hover:text-fg",
              )}
            >
              {m}m
            </button>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={60}
          value={minutes}
          onChange={(e) => setTimerMinutes(Number(e.target.value))}
          className="orbit-range hidden min-w-0 flex-1 md:block"
          aria-label="Timer duration in minutes"
        />
        <p className="hidden shrink-0 font-mono text-micro tabular-nums text-subtle lg:block">
          {minutes}m · max 60
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => (timer.running ? pauseTimer() : startTimer())}
            disabled={!task}
          >
            {timer.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {timer.running ? "Pause" : remaining === 0 ? "Restart" : "Start"}
          </Button>
          <Button variant="outline" size="icon" onClick={resetTimer} aria-label="Reset timer">
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function LinksWidget() {
  const links = useOrbitStore((s) => s.links);
  const addLink = useOrbitStore((s) => s.addLink);
  const updateLink = useOrbitStore((s) => s.updateLink);
  const removeLink = useOrbitStore((s) => s.removeLink);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  function openNew() {
    setEditingId("new");
    setLabel("");
    setHref("");
  }

  function openEdit(id: string) {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    setEditingId(id);
    setLabel(link.label);
    setHref(link.href);
  }

  function cancel() {
    setEditingId(null);
    setLabel("");
    setHref("");
  }

  function save() {
    if (!label.trim() || !href.trim()) return;
    if (editingId === "new") addLink(label, href);
    else if (editingId) updateLink(editingId, { label, href });
    cancel();
  }

  return (
    <WidgetShell
      label="Quick links"
      action={
        <button
          type="button"
          onClick={openNew}
          className="tap flex items-center gap-1 rounded-md px-1.5 py-0.5 text-micro text-muted hover:bg-fg/6 hover:text-fg"
        >
          <Plus className="size-3" />
          Add
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        {links.map((link) => (
          <div key={link.id} className="group relative">
            <a
              href={isSafeHttpUrl(link.href) ? link.href : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="tap glass-tight flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 hover:bg-fg/6"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-fg/6 font-mono text-micro font-medium text-fg">
                {link.mark}
              </span>
              <span className="max-w-full truncate px-0.5 text-micro text-muted">{link.label}</span>
            </a>
            <div className="absolute top-0.5 right-0.5 hidden gap-0.5 group-hover:flex">
              <button
                type="button"
                aria-label={`Edit ${link.label}`}
                onClick={(e) => {
                  e.preventDefault();
                  openEdit(link.id);
                }}
                className="tap flex size-5 items-center justify-center rounded-md bg-elevated text-muted shadow-[0_0_0_1px_rgb(255_255_255/0.1)] hover:text-fg"
              >
                <Pencil className="size-2.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${link.label}`}
                onClick={(e) => {
                  e.preventDefault();
                  removeLink(link.id);
                  if (editingId === link.id) cancel();
                }}
                className="tap flex size-5 items-center justify-center rounded-md bg-elevated text-muted shadow-[0_0_0_1px_rgb(255_255_255/0.1)] hover:text-danger"
              >
                <Trash2 className="size-2.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={openNew}
          className="tap flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/12 px-1 py-2.5 text-subtle hover:bg-fg/6 hover:text-muted"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-fg/6">
            <Plus className="size-3.5" />
          </span>
          <span className="text-micro">Add</span>
        </button>
      </div>
      {editingId && (
        <form
          className="mt-3 space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Name"
            className="h-8 w-full rounded-lg bg-fg/4 px-2.5 text-ui text-fg outline-none placeholder:text-subtle shadow-[0_0_0_1px_rgb(255_255_255/0.06)] focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_55%,transparent)]"
          />
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://"
            className="h-8 w-full rounded-lg bg-fg/4 px-2.5 text-ui text-fg outline-none placeholder:text-subtle shadow-[0_0_0_1px_rgb(255_255_255/0.06)] focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_55%,transparent)]"
          />
          <div className="flex items-center justify-end gap-1.5">
            <Button type="button" variant="ghost" onClick={cancel}>
              <X className="size-3.5" />
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!label.trim() || !href.trim()}>
              {editingId === "new" ? "Add link" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </WidgetShell>
  );
}

function TodayWidget() {
  const tasks = useOrbitStore((s) => s.tasks);
  const stats = useMemo(() => {
    const active = tasks.filter((t) => !isComplete(t));
    const done = tasks.filter((t) => isComplete(t));
    const steps = tasks.flatMap((t) => t.steps);
    const stepDone = steps.filter((s) => s.done).length;
    return { active: active.length, done: done.length, stepDone, stepTotal: steps.length };
  }, [tasks]);

  const pct = stats.stepTotal === 0 ? 0 : Math.round((stats.stepDone / stats.stepTotal) * 100);

  return (
    <WidgetShell label="Today">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-3xl font-medium tabular-nums tracking-tight">{pct}%</span>
        <span className="text-ui text-muted">
          {stats.stepDone}/{stats.stepTotal} steps
        </span>
      </div>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-fg/8">
        <div
          className="h-full rounded-full bg-linear-to-r from-lime to-violet transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-4 text-ui">
        <div>
          <p className="font-mono text-lg tabular-nums text-fg">{stats.active}</p>
          <p className="text-micro text-muted">Active</p>
        </div>
        <div>
          <p className="font-mono text-lg tabular-nums text-fg">{stats.done}</p>
          <p className="text-micro text-muted">Done</p>
        </div>
      </div>
    </WidgetShell>
  );
}

function ShortcutsWidget() {
  const rows = [
    ["Ctrl 1", "New task"],
    ["Ctrl 2", "Today board"],
    ["Ctrl 3", "Complete current step"],
    ["Ctrl 4", "Command palette"],
    ["Ctrl 5", "Start / pause timer"],
    ["Ctrl 6 / 7", "Previous / next task"],
    ["Ctrl 8", "Customize desk"],
    ["Ctrl 9", "Reset timer"],
  ];
  return (
    <WidgetShell label="Shortcuts">
      <ul className="space-y-1.5">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-3 text-ui">
            <span className="text-muted">{v}</span>
            <kbd className="rounded-md bg-fg/6 px-1.5 py-0.5 font-mono text-micro text-fg">{k}</kbd>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

function ActivityWidget() {
  const events = useOrbitStore((s) => s.events);
  return (
    <WidgetShell label="Activity">
      {events.length === 0 ? (
        <p className="text-ui text-muted">Complete a step and it shows up here.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.slice(0, 6).map((ev) => (
            <li key={ev.id} className="min-w-0">
              <p className="truncate text-ui text-fg">{ev.stepTitle}</p>
              <p className="truncate text-micro text-muted">{ev.taskTitle}</p>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

export function CustomizePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const enabled = useOrbitStore((s) => s.enabledWidgets);
  const toggleWidget = useOrbitStore((s) => s.toggleWidget);
  const moveWidget = useOrbitStore((s) => s.moveWidget);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/55 pt-[16vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium tracking-tight">Customize desk</h2>
            <p className="text-ui text-muted">Add or remove floating widgets. Order is top to bottom.</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
        <ul className="space-y-2">
          {WIDGET_CATALOG.map((item) => {
            const on = enabled.includes(item.kind);
            const idx = enabled.indexOf(item.kind);
            return (
              <li
                key={item.kind}
                className="glass-tight flex items-center gap-3 rounded-xl p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-medium text-fg">{item.label}</p>
                  <p className="text-micro text-muted">{item.blurb}</p>
                </div>
                {on && item.kind !== "timer" && (
                  <div className="flex">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveWidget(item.kind, -1)}
                      disabled={idx <= 0}
                      className="tap size-7 rounded-md text-muted hover:bg-fg/6 hover:text-fg disabled:opacity-30"
                    >
                      <ArrowUp className="mx-auto size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveWidget(item.kind, 1)}
                      disabled={idx === enabled.length - 1}
                      className="tap size-7 rounded-md text-muted hover:bg-fg/6 hover:text-fg disabled:opacity-30"
                    >
                      <ArrowDown className="mx-auto size-3.5" />
                    </button>
                  </div>
                )}
                <Switch checked={on} onCheckedChange={(v) => toggleWidget(item.kind, v)} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function NotesPanel() {
  const selectedId = useOrbitStore((s) => s.selectedTaskId);
  const task = useOrbitStore((s) => s.tasks.find((t) => t.id === selectedId) ?? null);
  const updateTask = useOrbitStore((s) => s.updateTask);
  const completeCurrentStep = useOrbitStore((s) => s.completeCurrentStep);

  if (!task) {
    return (
      <section className="glass rounded-2xl px-5 py-4 text-ui text-muted">
        Select a task to jot questions, blockers, or extra work. Autosaves on every keystroke.
      </section>
    );
  }

  const cur = currentStep(task);

  return (
    <section className="glass max-h-48 overflow-hidden rounded-2xl px-5 py-4 lg:max-h-44">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-micro font-medium tracking-wider text-subtle uppercase">Scratchpad</p>
          <p className="truncate text-ui text-muted">{task.title || "Untitled"}</p>
        </div>
        <p className="shrink-0 text-micro text-subtle">
          {cur ? (
            <>
              Ctrl 3 advances <span className="text-fg">{cur.title}</span>
            </>
          ) : (
            "Saved as you type"
          )}
        </p>
      </div>
      <textarea
        value={task.notes}
        onChange={(e) => updateTask(task.id, { notes: e.target.value })}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            completeCurrentStep(task.id);
          }
        }}
        placeholder="Questions, blockers, extra work that shows up mid-flight…"
        className="min-h-24 w-full resize-none overflow-y-auto bg-transparent text-ui leading-relaxed text-fg outline-none placeholder:text-subtle lg:min-h-16"
      />
    </section>
  );
}
