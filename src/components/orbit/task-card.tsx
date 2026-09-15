"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Timer, Trash2, X } from "lucide-react";
import { currentStep, isArchived, stepsFinished, useOrbitStore } from "@/lib/store";
import type { Step, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const noShift = () => null;

export function TaskCard({
  task,
  selected,
}: {
  task: Task;
  selected: boolean;
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
  const setTimerTask = useOrbitStore((s) => s.setTimerTask);
  const timerTaskId = useOrbitStore((s) => s.timer.taskId);
  const timerRunning = useOrbitStore((s) => s.timer.running);

  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const {
    attributes: taskDrag,
    listeners: taskListeners,
    setNodeRef: setTaskRef,
    setActivatorNodeRef: setTaskHandle,
    transform: taskTransform,
    transition: taskTransition,
    isDragging: taskDragging,
    isOver: taskOver,
  } = useSortable({
    id: task.id,
    data: { kind: "task" as const },
    animateLayoutChanges: () => false,
  });

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
    setPending(true);
    window.setTimeout(() => {
      completeCurrentStep(task.id);
      setPending(false);
    }, 160);
  }

  function onChipCheck(step: Step) {
    if (step.done) {
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
  }

  return (
    <article
      ref={setTaskRef}
      data-task-id={task.id}
      onClick={() => selectTask(task.id)}
      style={{
        transform: CSS.Transform.toString(taskTransform),
        transition: taskTransition,
        opacity: taskDragging ? 0.55 : undefined,
      }}
      className={cn(
        "group relative",
        selected && "rounded-xl bg-fg/[0.03]",
        focused && "orbit-ring-pulse rounded-xl",
        archived && "opacity-70",
        taskDragging && "z-20",
        taskOver && !taskDragging && "rounded-xl shadow-[0_0_0_1px_var(--color-violet)]",
      )}
    >
      <div className="flex items-start gap-2 px-1 py-1">
        <button
          ref={setTaskHandle}
          type="button"
          data-task-handle={task.id}
          aria-label="Drag task to reorder"
          className="tap mt-1 flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-subtle hover:text-fg active:cursor-grabbing"
          {...taskDrag}
          {...taskListeners}
          onPointerDown={(e) => {
            e.stopPropagation();
            taskListeners?.onPointerDown?.(e);
          }}
        >
          <GripVertical className="size-3.5" />
        </button>
        <TopicDot
          filled={archived}
          active={selected && !archived}
          ready={finished && !archived}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              ref={titleRef}
              value={task.title}
              placeholder="Task title"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-base font-medium tracking-tight text-fg outline-none placeholder:text-subtle"
            />
            <span className="hidden text-micro tabular-nums text-subtle sm:inline">
              {task.steps.length > 0 ? `${doneCount}/${task.steps.length}` : ""}
            </span>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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

          <div className="mt-1 flex items-center gap-2">
            <Wave className="w-12 shrink-0 text-muted" />
            <input
              value={task.notes}
              placeholder="Notes"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-ui text-muted outline-none placeholder:text-subtle"
            />
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5">
            <StepBoard
              taskId={task.id}
              steps={task.steps}
              currentId={current?.id}
              pending={pending}
              onChipCheck={onChipCheck}
              updateStepTitle={updateStepTitle}
              updateStepWidth={updateStepWidth}
              removeStep={removeStep}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitAdd();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 min-w-28 max-w-56 items-center gap-1.5 rounded-[10px] bg-fg/4 px-2 shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
            >
              <Plus className="size-3 shrink-0 text-subtle" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={task.steps.length === 0 ? "Step 1" : `Step ${task.steps.length + 1}`}
                className="w-full bg-transparent text-ui text-fg outline-none placeholder:text-subtle"
              />
            </form>
          </div>

          {finished && !archived && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                archiveTask(task.id);
              }}
              className="tap mt-2 flex items-center gap-2 text-ui text-violet hover:text-fg"
            >
              <StepCheck checked={false} onToggle={() => archiveTask(task.id)} accent label="Move to Done" />
              Move to Done
            </button>
          )}
          {archived && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                unarchiveTask(task.id);
              }}
              className="tap mt-2 text-ui text-muted hover:text-fg"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function StepGhost({ step }: { step: Step }) {
  return (
    <div
      className="glass-tight flex h-8 max-w-full items-center gap-1 rounded-[10px] px-2 shadow-glass"
      style={step.width != null ? { width: step.width } : undefined}
    >
      <GripVertical className="size-3 text-subtle" />
      <span className="truncate text-ui text-fg">{step.title || "Step"}</span>
    </div>
  );
}

function TopicDot({
  filled,
  active,
  ready,
}: {
  filled: boolean;
  active: boolean;
  ready: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full",
        "shadow-[0_0_0_1.5px_rgb(255_255_255/0.45)]",
        filled && "bg-lime shadow-[0_0_0_1.5px_var(--color-lime)]",
        ready && "shadow-[0_0_0_1.5px_var(--color-violet)]",
      )}
    >
      {active && !filled ? <span className="size-1.5 rounded-full bg-violet" /> : null}
    </span>
  );
}

function Wave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 10" className={className} aria-hidden>
      <path
        d="M1 5 Q 5 1 9 5 T 17 5 T 25 5 T 33 5 T 41 5 T 47 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
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
}: {
  taskId: string;
  steps: Step[];
  currentId?: string;
  pending: boolean;
  onChipCheck: (step: Step) => void;
  updateStepTitle: (taskId: string, stepId: string, title: string) => void;
  updateStepWidth: (taskId: string, stepId: string, width: number) => void;
  removeStep: (taskId: string, stepId: string) => void;
}) {
  const ids = steps.map((s) => s.id);
  return (
    <SortableContext items={ids} strategy={noShift}>
      <div className="flex flex-wrap items-start gap-1.5">
        {steps.map((step, i) => (
          <StepChip
            key={step.id}
            step={step}
            index={i}
            isCurrent={currentId === step.id}
            pending={pending}
            taskId={taskId}
            onChipCheck={onChipCheck}
            updateStepTitle={updateStepTitle}
            updateStepWidth={updateStepWidth}
            removeStep={removeStep}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function StepChip({
  step,
  index,
  isCurrent,
  pending,
  taskId,
  onChipCheck,
  updateStepTitle,
  updateStepWidth,
  removeStep,
}: {
  step: Step;
  index: number;
  isCurrent: boolean;
  pending: boolean;
  taskId: string;
  onChipCheck: (step: Step) => void;
  updateStepTitle: (taskId: string, stepId: string, title: string) => void;
  updateStepWidth: (taskId: string, stepId: string, width: number) => void;
  removeStep: (taskId: string, stepId: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(step.width ?? null);
  const widthRef = useRef<number | null>(width);
  const resize = useRef<{ x: number; w: number } | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
    isOver,
  } = useSortable({
    id: step.id,
    data: { kind: "step" as const, taskId },
    animateLayoutChanges: () => false,
    strategy: noShift,
  });

  useEffect(() => {
    setWidth(step.width ?? null);
    widthRef.current = step.width ?? null;
  }, [step.width]);

  function setRefs(node: HTMLDivElement | null) {
    boxRef.current = node;
    setNodeRef(node);
  }

  function onResizeStart(e: ReactPointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const w = boxRef.current?.getBoundingClientRect().width ?? 180;
    resize.current = { x: e.clientX, w };
    widthRef.current = w;
    setWidth(w);
  }
  function onResizeMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!resize.current) return;
    const next = Math.min(720, Math.max(160, resize.current.w + (e.clientX - resize.current.x)));
    widthRef.current = next;
    setWidth(next);
  }
  function onResizeEnd() {
    if (!resize.current) return;
    resize.current = null;
    if (widthRef.current != null) updateStepWidth(taskId, step.id, widthRef.current);
  }

  return (
    <div
      ref={setRefs}
      data-step-id={step.id}
      style={{
        width: width ?? undefined,
      }}
      className={cn(
        "glass-tight group/chip relative flex h-8 max-w-full items-center gap-1 rounded-[10px] pl-1 pr-3",
        width == null && "w-max",
        step.done && "opacity-70",
        isCurrent && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_55%,transparent)]",
        isDragging && "opacity-30",
        isOver && !isDragging && "shadow-[inset_2px_0_0_0_var(--color-violet)]",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        data-step-handle={step.id}
        className="tap flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-subtle hover:text-fg active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          e.stopPropagation();
          listeners?.onPointerDown?.(e);
        }}
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
