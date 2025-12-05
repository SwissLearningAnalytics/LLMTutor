import { cn } from "@/lib/utils/cn";
import { type TextareaHTMLAttributes, forwardRef } from "react";

export const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    textareaClassName?: string;
  }
>(({ className, textareaClassName, ...props }, ref) => (
  <label
    data-value={props.value || props.defaultValue}
    className={cn(
      className,
      "relative inline-grid w-full items-stretch align-top after:invisible after:whitespace-pre-wrap after:content-[attr(data-value)_'_'] after:[grid-area:1/1]",
    )}
  >
    <textarea
      ref={ref}
      data-1p-ignore
      autoComplete="off"
      data-lpignore="true"
      spellCheck={false}
      className={cn(
        textareaClassName,
        "w-auto resize-none appearance-none bg-transparent [font:inherit] [grid-area:1/1] focus-visible:outline-none",
      )}
      rows={1}
      {...props}
    />
  </label>
));
