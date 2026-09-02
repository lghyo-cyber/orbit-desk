import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "tap inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-fg ink hover:bg-fg/90 shadow-[0_0_0_1px_rgb(255_255_255/0.04)]",
        ghost:
          "bg-transparent text-muted hover:text-fg hover:bg-fg/5",
        outline:
          "bg-transparent text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.1)] hover:bg-fg/5",
        violet:
          "bg-violet text-violet-fg hover:bg-violet/90",
        lime: "bg-lime text-lime-fg hover:bg-lime/90",
      },
      size: {
        sm: "h-8 rounded-lg px-2.5 text-ui",
        md: "h-9 rounded-lg px-3 text-ui",
        icon: "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "ghost", size: "sm" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
