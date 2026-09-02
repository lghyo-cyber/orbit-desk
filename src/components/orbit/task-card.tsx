"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, GripVertical, Plus, Timer, Trash2, X } from "lucide-react";
import { currentStep, isArchived, stepsFinished, useOrbitStore } from "@/lib/store";
import type { Step, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  selected,
  fill,
}: {
  task: Task;
  selected: boolean;
  fill?: boolean;
}) {
  const selectTask = useOrbitStore((s) => s.selectTask);
  const updateTask = useOrbitStore((s) => s.updateTask);
  const removeTask = useOrbitStore((s) => s.removeTask);
  const completeCurrentStep = useOrbitStore((s) => s.completeCurrentStep);
  const archiveTask = useOrbitStore((s) => s.archiveTask);
  const unarchiveTask = useOrbitStore((s) => s.unarchiveTask);
  const uncompleteStep = useOrbitStore((s) => s.uncompleteStep);
  const addStep = useOrbitStore((s) => s.addStep);
  const updateStepTitle = useOrbitStore((s) => s.updateStepTitle);
  const updateStepWidth = useOrbitStore((s) => s.updateStepWidth);
  const removeStep = useOrbitStore((s) => s.removeStep);
  const reorderSteps = useOrbitStore((s) => s.reorderSteps);
  const setTimerTask = useOrbitStore((s) => s.setTimerTask);
  const timerTaskId = useOrbitStore((s) => s.timer.taskId);
  const timerRunning = useOrbitStore((s) => s.timer.running);

  const titleRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [dir, setDir] = useState(1);

  const current = currentStep(task);
  const finished = stepsFinished(task);
  const archived = isArchived(task);
  const doneCount = task.steps.filter((s) => s.done).length;
  const focused = timerTaskId === task.id && timerRunning;

  useEffect(() => {
    function onFocus(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id === task.id) {
        titleRef.current?.focus();
        titleRef.current?.select();
      }
    }
    window.addEventListener("orbit:focus-title", onFocus);
    return () => window.removeEventListener("orbit:focus-title", onFocus);
  }, [task.id]);

  function advance() {
    if (!current || pending) return;
    setDir(1);
    setPending(true);
    window.setTimeout(() => {
      completeCurrentStep(task.id);
      setPending(false);
    }, 160);
  }

  function onChipCheck(step: Step) {
    if (step.done) {
      setDir(-1);
      uncompleteStep(task.id, step.id);
      return;
    }
    if (current && step.id === current.id) advance();
  }

  function commitAdd() {
    const title = draft.replace(/\s+/g, " ").trim();
    if (!title) return;
    addStep(task.id, title);
    setDraft("");
    requestAnimationFrame(() => addRef.current?.focus());
  }

  return (
    <article
      onClick={() => selectTask(task.id)}
      className={cn(
        "glass group relative rounded-2xl p-4 transition-shadow duration-150",
        selected ? "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_55%,transparent)]" : "hover:shadow-border-hover",
        focused && "orbit-ring-pulse",
        archived && "opacity-80",
        fill && "flex h-full min-h-0 flex-col overflow-hidden",
      )}
    >
      <div className="mb-3 flex items-start gap-3 pr-14">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-micro font-medium tracking-wider text-subtle uppercase">
            <span className="tabular-nums">ORB-{task.number}</span>
            <span className="size-0.5 shrink-0 rounded-full bg-subtle" />
            <span className="truncate">{task.owner}</span>
            {archived ? (
              <span className="rounded-full bg-lime/15 px-1.5 py-px text-lime normal-case tracking-normal">
                Done
              </span>
            ) : finished ? (
              <span className="rounded-full bg-violet/18 px-1.5 py-px text-violet normal-case tracking-normal">
                Ready
              </span>
            ) : task.steps.length > 0 ? (
              <span className="tabular-nums normal-case tracking-normal text-muted">
                {doneCount}/{task.steps.length}
              </span>
            ) : (
              <span className="normal-case tracking-normal text-subtle">No steps yet</span>
            )}
          </div>
          <input
            ref={titleRef}
            value={task.title}
            placeholder="Task title"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="w-full bg-transparent text-base font-medium tracking-tight text-fg outline-none placeholder:text-subtle"
          />
        </div>
        <div className="absolute top-3 right-3 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Focus timer on this task"
            onClick={(e) => {
              e.stopPropagation();
              setTimerTask(task.id);
            }}
            className="tap flex size-7 items-center justify-center rounded-md text-muted hover:bg-fg/6 hover:text-fg"
          >
            <Timer className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete task"
            onClick={(e) => {
              e.stopPropagation();
              removeTask(task.id);
            }}
            className="tap flex size-7 items-center justify-center rounded-md text-muted hover:bg-fg/6 hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <SegmentBar steps={task.steps} currentId={current?.id} />

      <div className="mt-3 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={pending && current ? `${current.id}-pending` : (current?.id ?? (archived ? "done" : finished ? "ready" : "empty"))}
            custom={dir}
            initial={{ x: dir * 36, opacity: 0, filter: "blur(4px)" }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ x: dir * -36, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            {archived ? (
              <>
                <StepCheck
                  checked
                  onToggle={() => unarchiveTask(task.id)}
                  accent
                  label="Move back to Active"
                />
                <div>
                  <p className="text-micro font-medium tracking-wider text-subtle uppercase">Done</p>
                  <p className="text-ui text-fg">All steps finished</p>
                </div>
              </>
            ) : finished ? (
              <>
                <StepCheck
                  checked={false}
                  onToggle={() => archiveTask(task.id)}
                  accent
                  label="Move to Done"
                />
                <div>
                  <p className="text-micro font-medium tracking-wider text-subtle uppercase">Move to Done?</p>
                  <p className="text-ui text-fg">Check to file this task</p>
                </div>
              </>
            ) : current ? (
              <>
                <StepCheck
                  checked={pending}
                  onToggle={advance}
                  accent
                  label={`Complete ${current.title}`}
                />
                <div className="min-w-0">
                  <p className="text-micro font-medium tracking-wider text-subtle uppercase">Current step</p>
                  <p className="truncate text-base font-medium text-fg">{current.title}</p>
                </div>
              </>
            ) : (
              <>
                <span className="flex size-9 items-center justify-center rounded-xl bg-fg/6 text-muted">
                  <Plus className="size-4" />
                </span>
                <div>
                  <p className="text-micro font-medium tracking-wider text-subtle uppercase">Next</p>
                  <p className="text-ui text-muted">Add a step, then check it off to advance</p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {selected && (
        <div className={cn("mt-3 border-t border-border pt-3", fill && "min-h-0 flex-1 overflow-y-auto")}>
          <div className="flex flex-col gap-1.5">
            <StepBoard
              taskId={task.id}
              steps={task.steps}
              currentId={current?.id}
              pending={pending}
              onChipCheck={onChipCheck}
              updateStepTitle={updateStepTitle}
              updateStepWidth={updateStepWidth}
              removeStep={removeStep}
              reorderSteps={reorderSteps}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitAdd();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex min-h-16 min-w-56 flex-1 items-start gap-1.5 rounded-[10px] bg-fg/4 px-2 py-1.5 shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
            >
              <Plus className="mt-1 size-3.5 shrink-0 text-subtle" />
              <textarea
                ref={addRef}
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitAdd();
                  }
                }}
                placeholder={task.steps.length === 0 ? "Step 1, then Enter…" : `Step ${task.steps.length + 1}, then Enter`}
                className="min-h-12 w-full resize-y bg-transparent text-ui leading-relaxed text-fg outline-none placeholder:text-subtle"
              />
            </form>
          </div>
        </div>
      )}
    </article>
  );
}

function insertIndexAtPoint(
  board: HTMLElement,
  x: number,
  y: number,
  dragId: string,
  order: string[],
): number {
  const rest = order.filter((id) => id !== dragId);
  if (rest.length === 0) return 0;
  let best = 0;
  let bestScore = Infinity;
  let after = false;
  for (let i = 0; i < rest.length; i++) {
    const id = rest[i];
    if (!id) continue;
    const el = board.querySelector(`[data-step-id="${CSS.escape(id)}"]`);
    if (!(el instanceof HTMLElement)) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const score = dx * dx + dy * dy;
    if (score < bestScore) {
      bestScore = score;
      best = i;
      after = Math.abs(dx) >= Math.abs(dy) ? dx > 0 : dy > 0;
    }
  }
  return after ? best + 1 : best;
}

function StepBoard({
  taskId,
  steps,
  currentId,
  pending,
  onChipCheck,
  updateStepTitle,
  updateStepWidth,
  removeStep,
  reorderSteps,
}: {
  taskId: string;
  steps: Step[];
  currentId?: string;
  pending: boolean;
  onChipCheck: (step: Step) => void;
  updateStepTitle: (taskId: string, stepId: string, title: string) => void;
  updateStepWidth: (taskId: string, stepId: string, width: number) => void;
  removeStep: (taskId: string, stepId: string) => void;
  reorderSteps: (taskId: string, orderedIds: string[]) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef(steps.map((s) => s.id));
  orderRef.current = steps.map((s) => s.id);
  const [float, setFloat] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const grab = useRef<{ id: string; ox: number; oy: number } | null>(null);

  useEffect(() => {
    function move(e: PointerEvent) {
      const g = grab.current;
      const board = boardRef.current;
      if (!g || !board) return;
      const x = e.clientX - g.ox;
      const y = e.clientY - g.oy;
      setFloat((f) => (f && f.id === g.id ? { ...f, x, y } : f));
      const insert = insertIndexAtPoint(board, e.clientX, e.clientY, g.id, orderRef.current);
      const rest = orderRef.current.filter((id) => id !== g.id);
      const next = [...rest.slice(0, insert), g.id, ...rest.slice(insert)];
      if (next.some((id, i) => id !== orderRef.current[i])) {
        orderRef.current = next;
        reorderSteps(taskId, next);
      }
    }
    function up() {
      grab.current = null;
      setFloat(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [reorderSteps, taskId]);

  const dragging = steps.find((s) => s.id === float?.id) ?? null;

  return (
    <>
      <div ref={boardRef} className="flex flex-wrap items-start gap-1.5">
        {steps.map((step, i) => (
          <StepChip
            key={step.id}
            step={step}
            index={i}
            isCurrent={currentId === step.id}
            pending={pending}
            taskId={taskId}
            lifted={float?.id === step.id}
            onChipCheck={onChipCheck}
            updateStepTitle={updateStepTitle}
            updateStepWidth={updateStepWidth}
            removeStep={removeStep}
            onLift={(e, box) => {
              const r = box.getBoundingClientRect();
              grab.current = {
                id: step.id,
                ox: e.clientX - r.left,
                oy: e.clientY - r.top,
              };
              setFloat({ id: step.id, x: r.left, y: r.top, w: r.width, h: r.height });
            }}
          />
        ))}
      </div>
      {float && dragging ? (
        <div
          aria-hidden
          style={{
            width: float.w,
            height: float.h,
            transform: `translate3d(${float.x}px, ${float.y}px, 0)`,
          }}
          className="pointer-events-none fixed top-0 left-0 z-50 flex items-center gap-1 rounded-[10px] bg-elevated/92 px-2 shadow-glass backdrop-blur-md"
        >
          <GripVertical className="size-3 text-subtle" />
          <span className="truncate text-ui text-fg">{dragging.title || "Step"}</span>
        </div>
      ) : null}
    </>
  );
}

function StepChip({
  step,
  index,
  isCurrent,
  pending,
  taskId,
  lifted,
  onChipCheck,
  updateStepTitle,
  updateStepWidth,
  removeStep,
  onLift,
}: {
  step: Step;
  index: number;
  isCurrent: boolean;
  pending: boolean;
  taskId: string;
  lifted: boolean;
  onChipCheck: (step: Step) => void;
  updateStepTitle: (taskId: string, stepId: string, title: string) => void;
  updateStepWidth: (taskId: string, stepId: string, width: number) => void;
  removeStep: (taskId: string, stepId: string) => void;
  onLift: (e: ReactPointerEvent<HTMLButtonElement>, box: HTMLDivElement) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(step.width ?? null);
  const widthRef = useRef<number | null>(width);
  const drag = useRef<{ x: number; w: number } | null>(null);

  useEffect(() => {
    setWidth(step.width ?? null);
    widthRef.current = step.width ?? null;
  }, [step.width]);

  function onResizeStart(e: ReactPointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const w = boxRef.current?.getBoundingClientRect().width ?? 180;
    drag.current = { x: e.clientX, w };
    widthRef.current = w;
    setWidth(w);
  }
  function onResizeMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const next = Math.min(720, Math.max(160, drag.current.w + (e.clientX - drag.current.x)));
    widthRef.current = next;
    setWidth(next);
  }
  function onResizeEnd() {
    if (!drag.current) return;
    drag.current = null;
    if (widthRef.current != null) updateStepWidth(taskId, step.id, widthRef.current);
  }

  return (
    <motion.div
      layout
      data-step-id={step.id}
      ref={boxRef}
      style={width != null ? { width } : undefined}
      className={cn(
        "glass-tight group/chip relative flex h-8 max-w-full items-center gap-1 rounded-[10px] pl-1 pr-3",
        width == null && "w-max",
        step.done && "opacity-70",
        isCurrent && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_55%,transparent)]",
        lifted && "opacity-30",
      )}
      transition={{ type: "spring", duration: 0.28, bounce: 0 }}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (boxRef.current) onLift(e, boxRef.current);
        }}
        className="tap flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-subtle hover:text-fg active:cursor-grabbing"
      >
        <GripVertical className="size-3" />
      </button>
      <StepCheck
        checked={step.done || (pending && isCurrent)}
        onToggle={() => onChipCheck(step)}
        disabled={!step.done && !isCurrent}
      />
      <input
        value={step.title}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => updateStepTitle(taskId, step.id, e.target.value)}
        className={cn(
          "bg-transparent text-ui text-fg outline-none [field-sizing:content]",
          "min-w-16 max-w-[40rem]",
          step.done && "text-muted",
        )}
        aria-label={`Step ${index + 1}`}
        size={Math.max(4, step.title.length || 4)}
      />
      <button
        type="button"
        aria-label="Remove step"
        onClick={(e) => {
          e.stopPropagation();
          removeStep(taskId, step.id);
        }}
        className="tap flex size-6 shrink-0 items-center justify-center rounded-md text-subtle opacity-0 hover:text-fg group-hover/chip:opacity-100"
      >
        <X className="size-3" />
      </button>
      <button
        type="button"
        aria-label="Resize step"
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
        className="absolute top-1 right-0 h-6 w-1.5 cursor-ew-resize rounded-full bg-fg/30 hover:bg-fg/60"
      />
    </motion.div>
  );
}

function SegmentBar({ steps, currentId }: { steps: Step[]; currentId?: string }) {
  if (steps.length === 0) {
    return <div className="h-0.5 w-full rounded-full bg-fg/8" />;
  }
  return (
    <div className="flex gap-1">
      {steps.map((s) => (
        <div
          key={s.id}
          className={cn(
            "h-0.5 flex-1 rounded-full transition-colors duration-300",
            s.done ? "bg-lime" : s.id === currentId ? "bg-violet" : "bg-fg/10",
          )}
        />
      ))}
    </div>
  );
}

function StepCheck({
  checked,
  onToggle,
  disabled,
  accent,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accent?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-[6px]",
        "after:absolute after:top-1/2 after:left-1/2 after:size-9 after:-translate-x-1/2 after:-translate-y-1/2",
        "transition-transform duration-150 ease-out active:not-disabled:scale-[0.96]",
        checked
          ? "bg-lime text-lime-fg"
          : accent
            ? "size-9 rounded-xl shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_70%,transparent)] hover:bg-violet/15"
            : "shadow-[0_0_0_1px_rgb(255_255_255/0.16)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_70%,transparent)]",
        disabled && !checked && "opacity-30",
      )}
    >
      {checked ? (
        <Check className={cn(accent ? "size-4" : "size-3")} strokeWidth={2.6} />
      ) : null}
    </button>
  );
}
