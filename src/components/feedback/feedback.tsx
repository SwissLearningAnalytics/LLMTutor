import { InfoIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getScaleOptions, YES } from "@/lib/feedback/annotations";
import type { Annotation, AnnotationMode } from "@/lib/feedback/types";
import { cn } from "@/lib/utils/cn";

export function Feedback({
  annotations,
  mode,
  feedback,
  setFeedback,
}: {
  annotations: Annotation[];
  mode: Exclude<AnnotationMode, "none">;
  feedback: Record<string, string | undefined>;
  setFeedback: (feedback: Record<string, string | undefined>) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isRequired = mode === "required";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (annotations.length === 0) {
    return null;
  }

  const inFocusState = annotations.every(
    (annotation) => !feedback[annotation.key],
  );

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.4,
        }}
        className={cn(
          inFocusState && isRequired ? "shadow-focus" : "",
          "m-auto mb-4 space-y-3 rounded-lg border bg-white p-4",
        )}
      >
        {annotations.map((annotation) =>
          // optional yes/no annotations are rendered as a checkbox, everything else as buttons
          !isRequired && annotation.scale === "yes-no" ? (
            <FeedbackCheckbox
              key={annotation.key}
              annotation={annotation}
              feedback={feedback}
              setFeedback={setFeedback}
            />
          ) : (
            <div key={annotation.key}>
              <FeedbackQuestion
                question={annotation.question}
                tooltip={annotation.tooltip}
              />
              <div className="flex gap-2">
                {getScaleOptions(annotation.scale).map((option, _, options) => (
                  <FeedbackButton
                    key={option}
                    isSelected={feedback[annotation.key] === option}
                    value={option}
                    variant={options.length > 3 ? "small" : "default"}
                    onClick={() =>
                      setFeedback({
                        ...feedback,
                        [annotation.key]:
                          feedback[annotation.key] === option
                            ? undefined
                            : option,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </motion.div>
      <div ref={bottomRef} />
    </>
  );
}

function FeedbackQuestion({
  question,
  tooltip,
}: {
  question: string;
  tooltip?: string;
}) {
  return (
    <div className="mb-2 flex w-full items-center justify-between gap-3">
      <p className="text-sm">{question}</p>
      {tooltip && (
        <Popover>
          <PopoverTrigger
            asChild
            className="pointer-events-auto self-start text-secondary"
          >
            <Button
              variant="ghost"
              size="icon"
              className="-m-1.5 size-10 rounded-sm bg-transparent focus-visible:ring-offset-0"
            >
              <InfoIcon className="size-5! shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">{tooltip}</PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function FeedbackButton({
  isSelected,
  value,
  onClick,
  variant = "default",
}: {
  isSelected: boolean;
  value: string;
  onClick: () => void;
  variant?: "default" | "small";
}) {
  return (
    <Button
      className={cn(isSelected && "bg-surface-button-accent text-black", {
        "min-w-0 flex-1": variant === "small",
        "w-20": variant === "default",
      })}
      onClick={onClick}
    >
      {value}
    </Button>
  );
}

function FeedbackCheckbox({
  annotation,
  feedback,
  setFeedback,
}: {
  annotation: Annotation;
  feedback: Record<string, string | undefined>;
  setFeedback: (feedback: Record<string, string | undefined>) => void;
}) {
  const isSelected = Boolean(feedback[annotation.key]);

  return (
    <Label className="flex items-center gap-3 rounded-lg border p-3 text-secondary has-aria-checked:border-black has-aria-checked:text-black">
      <Checkbox
        id={`toggle-${annotation.key}`}
        checked={isSelected}
        aria-checked={isSelected}
        onCheckedChange={(checked) => {
          setFeedback({
            ...feedback,
            [annotation.key]: checked ? YES : undefined,
          });
        }}
      />
      <div className="flex w-full items-center justify-between gap-1.5 font-normal">
        <p className="text-sm leading-none font-medium">
          {annotation.question}
        </p>
        {annotation.tooltip && (
          <Popover>
            <PopoverTrigger
              asChild
              className="pointer-events-auto self-start text-secondary"
            >
              <Button
                variant="ghost"
                size="icon"
                className="-m-1.5 size-10 rounded-sm bg-transparent focus-visible:ring-offset-0"
              >
                <InfoIcon className="size-5! shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">{annotation.tooltip}</PopoverContent>
          </Popover>
        )}
      </div>
    </Label>
  );
}
