import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: SwitchPrimitive.SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "tap peer inline-flex h-5 w-9 shrink-0 items-center rounded-full",
        "shadow-[0_0_0_1px_rgb(255_255_255/0.1)] bg-fg/10",
        "data-[state=checked]:bg-violet data-[state=checked]:shadow-none",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
