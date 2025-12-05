import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex text-charcoal text-nowrap items-center gap-2.5 rounded-sm cursor-default px-1.5 py-1 text-xs",
  {
    variants: {
      variant: {
        gray: "bg-surface-feedback-neutral-light",
        green: "bg-surface-feedback-positive-light-secondary",
        blue: "bg-surface-feedback-info-light",
        orange: "bg-surface-feedback-pending-light",
        black: "bg-surface-background-secondary text-white",
        red: "bg-surface-feedback-negative-light",
      },
    },
    defaultVariants: {
      variant: "gray",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
