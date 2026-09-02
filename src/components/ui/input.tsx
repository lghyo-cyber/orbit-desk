import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg bg-fg/4 px-3 text-ui text-fg outline-none",
        "shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
        "placeholder:text-subtle",
        "focus-visible:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_70%,white)]",
        className,
      )}
      {...props}
    />
  );
}
