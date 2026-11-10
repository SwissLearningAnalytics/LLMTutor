import {
  type ComponentProps,
  type ReactNode,
  type UIEvent,
  useRef,
  useState,
} from "react";
import { MemoizedMarkdown } from "@/components/ui/memoized-markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { SegmentedControl } from "@/routes/admin/-components/segmented-control";

type Mode = "edit" | "preview" | "split";

const modes: { value: Mode; label: string; className?: string }[] = [
  { value: "edit", label: "Bearbeiten" },
  { value: "preview", label: "Vorschau" },
  // splitting only makes sense on wide screens
  { value: "split", label: "Geteilt", className: "hidden lg:inline-flex" },
];

type MarkdownTextareaProps = Omit<ComponentProps<typeof Textarea>, "value"> & {
  label: ReactNode;
  value?: string;
};

// plaintext textarea with an optional rendered markdown preview
export function MarkdownTextarea({
  label,
  value = "",
  id,
  className,
  ...props
}: MarkdownTextareaProps) {
  const [mode, setMode] = useState<Mode>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // the element currently being scrolled programmatically, so its own scroll
  // event doesn't sync back and cause a feedback loop
  const syncTargetRef = useRef<HTMLElement | null>(null);

  // in split mode, scroll the other pane to the same relative position
  const syncScroll = (e: UIEvent<HTMLElement>) => {
    if (mode !== "split") return;
    const source = e.currentTarget;
    if (syncTargetRef.current === source) return;
    const target =
      source === textareaRef.current ? previewRef.current : textareaRef.current;
    if (!target) return;

    const sourceMax = source.scrollHeight - source.clientHeight;
    const ratio = sourceMax > 0 ? source.scrollTop / sourceMax : 0;
    syncTargetRef.current = target;
    target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    // the induced scroll event fires before the next frame
    requestAnimationFrame(() => {
      syncTargetRef.current = null;
    });
  };

  const preview = (
    <div
      ref={previewRef}
      onScroll={syncScroll}
      className={cn(
        "prose max-w-none! overflow-auto rounded-md border bg-surface-primary px-3 py-2 text-sm",
        className,
      )}
    >
      {value.trim() ? (
        <MemoizedMarkdown
          id={`${id}-preview`}
          parts={[{ type: "text", text: value }]}
        />
      ) : (
        <p className="text-muted-foreground">Keine Inhalte</p>
      )}
    </div>
  );

  return (
    // outer div absorbs the parent Field's `[&>*]:w-full`, so the inner one can be wider
    <div>
      <div
        className={cn(
          "flex flex-col gap-3",
          // in split mode, break out of the narrow form column up to the width of
          // the nearest container (the Layout's <main>), centered on the column
          mode === "split" &&
            "lg:relative lg:left-1/2 lg:w-[min(100cqw,96rem)] lg:-translate-x-1/2",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {label}
          <SegmentedControl
            label="Ansicht"
            options={modes}
            value={mode}
            onChange={setMode}
          />
        </div>
        <div className={cn(mode === "split" && "grid gap-2 lg:grid-cols-2")}>
          {/* keep the textarea mounted so focus/scroll state and form wiring survive mode switches */}
          <Textarea
            id={id}
            value={value}
            className={cn(
              "bg-surface-primary",
              className,
              mode === "preview" && "hidden",
            )}
            {...props}
            ref={textareaRef}
            onScroll={syncScroll}
          />
          {mode !== "edit" && preview}
        </div>
      </div>
    </div>
  );
}
