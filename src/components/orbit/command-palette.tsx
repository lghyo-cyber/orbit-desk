"use client";

import { useEffect, useMemo } from "react";
import { Command } from "cmdk";
import {
  Check,
  Focus,
  LayoutGrid,
  Link2,
  Plus,
  Search,
  Timer,
} from "lucide-react";
import { isComplete, useOrbitStore } from "@/lib/store";
import { WIDGET_CATALOG } from "@/lib/types";
import { cn, isSafeHttpUrl } from "@/lib/utils";

export function CommandPalette({
  open,
  onClose,
  onCustomize,
}: {
  open: boolean;
  onClose: () => void;
  onCustomize: () => void;
}) {
  const tasks = useOrbitStore((s) => s.tasks);
  const addTask = useOrbitStore((s) => s.addTask);
  const selectTask = useOrbitStore((s) => s.selectTask);
  const advanceTask = useOrbitStore((s) => s.advanceTask);
  const selectedTaskId = useOrbitStore((s) => s.selectedTaskId);
  const startTimer = useOrbitStore((s) => s.startTimer);
  const pauseTimer = useOrbitStore((s) => s.pauseTimer);
  const timer = useOrbitStore((s) => s.timer);
  const links = useOrbitStore((s) => s.links);
  const toggleWidget = useOrbitStore((s) => s.toggleWidget);
  const enabled = useOrbitStore((s) => s.enabledWidgets);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const active = useMemo(() => tasks.filter((t) => !isComplete(t)), [tasks]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/55 pt-[18vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <Command
        className="glass w-full max-w-lg overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-subtle" />
          <Command.Input placeholder="Add a task, jump, or run a command…" autoFocus />
        </div>
        <Command.List>
          <Command.Empty>No results. Type a title and create it.</Command.Empty>

          <Command.Group heading="Actions">
            <Command.Item
              onSelect={() => {
                const id = addTask("");
                onClose();
                window.dispatchEvent(new CustomEvent("orbit:focus-title", { detail: id }));
              }}
            >
              <Plus className="size-4 text-muted" />
              New task
              <span className="ml-auto font-mono text-micro text-subtle">Ctrl 1</span>
            </Command.Item>
            <Command.Item
              disabled={!selectedTaskId}
              onSelect={() => {
                if (selectedTaskId) advanceTask(selectedTaskId);
                onClose();
              }}
            >
              <Check className="size-4 text-muted" />
              Complete step / move to Done
              <span className="ml-auto font-mono text-micro text-subtle">Ctrl 3</span>
            </Command.Item>
            <Command.Item
              onSelect={() => {
                if (timer.running) pauseTimer();
                else startTimer();
                onClose();
              }}
            >
              <Timer className="size-4 text-muted" />
              {timer.running ? "Pause timer" : "Start timer"}
              <span className="ml-auto font-mono text-micro text-subtle">Ctrl 5</span>
            </Command.Item>
            <Command.Item
              onSelect={() => {
                window.dispatchEvent(new CustomEvent("orbit:toggle-today"));
                onClose();
              }}
            >
              <Focus className="size-4 text-muted" />
              Toggle today board
              <span className="ml-auto font-mono text-micro text-subtle">Ctrl 2</span>
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onClose();
                onCustomize();
              }}
            >
              <LayoutGrid className="size-4 text-muted" />
              Customize widgets
              <span className="ml-auto font-mono text-micro text-subtle">Ctrl 8</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Tasks">
            {active.map((t) => (
              <Command.Item
                key={t.id}
                value={`${t.title} ORB-${t.number}`}
                onSelect={() => {
                  selectTask(t.id);
                  onClose();
                }}
              >
                <span className="font-mono text-micro text-subtle">ORB-{t.number}</span>
                <span className={cn("truncate", !t.title && "text-muted")}>
                  {t.title || "Untitled"}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Widgets">
            {WIDGET_CATALOG.map((w) => {
              const on = enabled.includes(w.kind);
              return (
                <Command.Item
                  key={w.kind}
                  onSelect={() => toggleWidget(w.kind, !on)}
                >
                  <LayoutGrid className="size-4 text-muted" />
                  {on ? "Hide" : "Add"} {w.label.toLowerCase()}
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="Links">
            {links.map((link) => (
              <Command.Item
                key={link.id}
                onSelect={() => {
                  if (isSafeHttpUrl(link.href)) {
                    window.open(link.href, "_blank", "noopener,noreferrer");
                  }
                  onClose();
                }}
              >
                <Link2 className="size-4 text-muted" />
                Open {link.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-micro text-subtle">
          <span>Enter to run</span>
          <span>Esc to close</span>
        </div>
      </Command>
    </div>
  );
}
