"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Focus, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/orbit/command-palette";
import { TaskCard } from "@/components/orbit/task-card";
import { CustomizePanel, NotesPanel, TimerDock, WidgetColumn } from "@/components/orbit/widgets";
import { isComplete, useOrbitStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { FilterId } from "@/lib/types";

export function OrbitApp() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    try {
      void Promise.resolve(useOrbitStore.persist.rehydrate()).then(done, done);
    } catch {
      done();
    }
    const t = window.setTimeout(done, 120);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);
  if (!ready) return <DeskSkeleton />;
  return <Desk />;
}

function Desk() {
  const [palette, setPalette] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [today, setToday] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const tasks = useOrbitStore((s) => s.tasks);
  const filter = useOrbitStore((s) => s.filter);
  const setFilter = useOrbitStore((s) => s.setFilter);
  const selectedTaskId = useOrbitStore((s) => s.selectedTaskId);
  const selectTask = useOrbitStore((s) => s.selectTask);
  const addTask = useOrbitStore((s) => s.addTask);
  const completeCurrentStep = useOrbitStore((s) => s.completeCurrentStep);
  const startTimer = useOrbitStore((s) => s.startTimer);
  const pauseTimer = useOrbitStore((s) => s.pauseTimer);
  const resetTimer = useOrbitStore((s) => s.resetTimer);
  const timerRunning = useOrbitStore((s) => s.timer.running);

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      const done = isComplete(t);
      if (today) return !done;
      if (filter === "done") return done;
      if (filter === "active") return !done;
      return true;
    });
  }, [tasks, filter, today]);

  const todayCols = visible.length <= 1 ? 1 : 2;

  useEffect(() => {
    function onToggle() {
      setToday((v) => !v);
    }
    window.addEventListener("orbit:toggle-today", onToggle);
    return () => window.removeEventListener("orbit:toggle-today", onToggle);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPalette(false);
        setCustomize(false);
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key;
      if (key === "1") {
        e.preventDefault();
        const id = addTask("");
        window.dispatchEvent(new CustomEvent("orbit:focus-title", { detail: id }));
        return;
      }
      if (key === "2") {
        e.preventDefault();
        setToday((v) => !v);
        return;
      }
      if (key === "3") {
        if (selectedTaskId) {
          e.preventDefault();
          completeCurrentStep(selectedTaskId);
        }
        return;
      }
      if (key === "4") {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (key === "5") {
        e.preventDefault();
        if (timerRunning) pauseTimer();
        else startTimer();
        return;
      }
      if (key === "6") {
        e.preventDefault();
        moveSelection(visible.map((t) => t.id), selectedTaskId, -1, selectTask);
        return;
      }
      if (key === "7") {
        e.preventDefault();
        moveSelection(visible.map((t) => t.id), selectedTaskId, 1, selectTask);
        return;
      }
      if (key === "8") {
        e.preventDefault();
        setCustomize((v) => !v);
        return;
      }
      if (key === "9") {
        e.preventDefault();
        resetTimer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    addTask,
    completeCurrentStep,
    pauseTimer,
    resetTimer,
    selectTask,
    selectedTaskId,
    startTimer,
    timerRunning,
    visible,
  ]);

  function onDragStart(e: PointerEvent<HTMLElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, kbd")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onDragMove(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  }
  function onDragEnd() {
    drag.current = null;
  }

  return (
    <div className="orbit-desktop relative min-h-svh overflow-hidden text-fg">
      <div className="orbit-noise pointer-events-none fixed inset-0" />

      <div
        className="orbit-window absolute inset-10 flex flex-col overflow-hidden rounded-3xl bg-surface/80 backdrop-blur-2xl"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <TopBar
          today={today}
          onToday={() => setToday((v) => !v)}
          onPalette={() => setPalette(true)}
          onCustomize={() => setCustomize(true)}
          onNew={() => {
            const id = addTask("");
            window.dispatchEvent(new CustomEvent("orbit:focus-title", { detail: id }));
          }}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />

        <div
          className={cn(
            "grid min-h-0 flex-1 gap-3 px-4 pb-3",
            today ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_18rem]",
          )}
        >
          <section className="flex min-h-0 min-w-0 flex-col gap-3">
            {!today && (
              <div className="flex items-center justify-between gap-3">
                <FilterTabs value={filter} onChange={setFilter} />
                <p className="text-micro text-subtle">
                  {visible.length} {filter === "done" ? "completed" : filter === "active" ? "in play" : "total"}
                </p>
              </div>
            )}
            {visible.length === 0 ? (
              <EmptyState
                filter={today ? "active" : filter}
                onNew={() => {
                  const id = addTask("");
                  window.dispatchEvent(new CustomEvent("orbit:focus-title", { detail: id }));
                }}
              />
            ) : today ? (
              <div
                className={cn(
                  "grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1",
                  todayCols === 1 ? "grid-cols-1" : "grid-cols-2",
                  "auto-rows-72",
                )}
              >
                {visible.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    selected={task.id === selectedTaskId}
                    fill
                  />
                ))}
              </div>
            ) : (
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {visible.map((task) => (
                  <TaskCard key={task.id} task={task} selected={task.id === selectedTaskId} />
                ))}
              </div>
            )}
          </section>
          {!today && (
            <div className="min-h-0 overflow-y-auto">
              <WidgetColumn />
            </div>
          )}
        </div>

        {!today && <div className="px-4"><NotesPanel /></div>}
        <div className="px-4 pb-4 pt-3">
          <TimerDock />
        </div>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        onCustomize={() => setCustomize(true)}
      />
      <CustomizePanel open={customize} onClose={() => setCustomize(false)} />
    </div>
  );
}

function TopBar({
  today,
  onToday,
  onPalette,
  onCustomize,
  onNew,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  today: boolean;
  onToday: () => void;
  onPalette: () => void;
  onCustomize: () => void;
  onNew: () => void;
  onDragStart: (e: PointerEvent<HTMLElement>) => void;
  onDragMove: (e: PointerEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <header
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      className="flex cursor-grab items-center gap-3 px-4 py-3 active:cursor-grabbing"
    >
      <span className="flex items-center gap-1.5 pr-1">
        <span className="size-2.5 rounded-full bg-fg/18" />
        <span className="size-2.5 rounded-full bg-fg/10" />
        <span className="size-2.5 rounded-full bg-lime/70" />
      </span>
      <Logo />
      <div className="min-w-0">
        <p className="text-ui font-medium tracking-tight text-fg">Orbit</p>
        <p className="text-micro text-subtle">Sticky desk</p>
      </div>
      <button
        type="button"
        onClick={onPalette}
        className="tap mx-auto hidden h-9 max-w-md flex-1 cursor-pointer items-center gap-2 rounded-xl bg-fg/4 px-3 text-ui text-subtle shadow-[0_0_0_1px_rgb(255_255_255/0.06)] hover:text-muted sm:flex"
      >
        <span className="flex-1 text-left">Add or jump to a task</span>
        <kbd className="rounded-md bg-fg/6 px-1.5 py-0.5 font-mono text-micro text-muted">Ctrl 4</kbd>
      </button>
      <SaveMark />
      <Clock />
      <Button
        variant={today ? "violet" : "outline"}
        onClick={onToday}
        aria-pressed={today}
      >
        <Focus className="size-3.5" />
        Today
      </Button>
      <Button variant="outline" size="icon" onClick={onCustomize} aria-label="Customize widgets">
        <LayoutGrid className="size-3.5" />
      </Button>
      <Button variant="primary" onClick={onNew}>
        <Plus className="size-3.5" />
        New task
      </Button>
    </header>
  );
}

function Logo() {
  return (
    <span className="relative flex size-8 items-center justify-center rounded-lg bg-fg/6">
      <span className="size-4 rounded-full shadow-[0_0_0_1.5px_var(--color-violet)]" />
      <span className="absolute top-1.5 size-1.5 rounded-full bg-lime" />
    </span>
  );
}

function SaveMark() {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    let t: number;
    const unsub = useOrbitStore.subscribe(() => {
      setFlash(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setFlash(false), 700);
    });
    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);
  return (
    <span className="hidden items-center gap-1.5 text-micro text-subtle md:flex">
      <span
        className={cn(
          "size-1.5 rounded-full",
          flash ? "bg-lime" : "bg-fg/20",
        )}
      />
      Saved
    </span>
  );
}

function Clock() {
  const [text, setText] = useState("");
  useEffect(() => {
    function tick() {
      setText(
        new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="hidden font-mono text-ui tabular-nums text-muted lg:block">{text}</span>;
}

function FilterTabs({ value, onChange }: { value: FilterId; onChange: (v: FilterId) => void }) {
  const tabs: FilterId[] = ["active", "done", "all"];
  return (
    <div className="glass-tight flex rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "tap h-7 rounded-lg px-3 text-ui capitalize",
            value === tab ? "bg-fg/10 text-fg" : "text-muted hover:text-fg",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ filter, onNew }: { filter: FilterId; onNew: () => void }) {
  return (
    <div className="glass flex flex-col items-start gap-3 rounded-2xl p-6">
      <p className="text-base font-medium tracking-tight">
        {filter === "done" ? "Nothing completed yet" : "The desk is clear"}
      </p>
      <p className="max-w-md text-ui text-muted">
        {filter === "done"
          ? "Check off every step on a task and it lands here."
          : "Create a task, add steps in order, then check the current one to swipe into the next."}
      </p>
      {filter !== "done" && (
        <Button variant="primary" onClick={onNew}>
          <Plus className="size-3.5" />
          New task
        </Button>
      )}
    </div>
  );
}

function DeskSkeleton() {
  return (
    <div className="orbit-desktop min-h-svh text-fg">
      <div className="orbit-window absolute inset-10 rounded-3xl bg-surface/80 p-4 text-ui text-muted">
        Orbit
      </div>
    </div>
  );
}

function moveSelection(
  ids: string[],
  current: string | null,
  dir: 1 | -1,
  select: (id: string) => void,
) {
  if (ids.length === 0) return;
  const i = current ? ids.indexOf(current) : -1;
  const next = i < 0 ? ids[0] : ids[(i + dir + ids.length) % ids.length];
  if (next) select(next);
}
