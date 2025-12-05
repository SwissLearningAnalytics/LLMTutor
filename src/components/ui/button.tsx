import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center select-none hover:opacity-75 justify-center gap-2 whitespace-nowrap will-change-[opacity] rounded-md text-button font-medium ring-offset-surface-background-primary transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 duration-300",
  {
    variants: {
      variant: {
        default: "bg-surface-button-primary text-invert",
        destructive: "bg-surface-button-accent text-button-outline",
        outline: "border bg-surface-button-outline",
        secondary: "bg-surface-button-secondary text-button-outline ",
        neutral:
          "bg-surface-background-primary text-primary border-border-primary border ",
        ghost: "",
        link: "underline-offset-4 hover:underline",
        blue: "bg-surface-dark-bubblegum text-white",
      },
      size: {
        default: "h-10 px-4",
        thin: "h-10 px-[5px]",
        sm: "h-9 rounded-md px-3",
        md: "h-[2.625rem] rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, disabled, asChild = false, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
