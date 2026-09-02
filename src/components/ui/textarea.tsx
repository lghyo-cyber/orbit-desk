import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-lg bg-transparent px-0 py-0 text-ui text-fg outline-none",
        "placeholder:text-subtle leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
