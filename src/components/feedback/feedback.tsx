import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FeedbackField } from "@/lib/feedback/types";
import { cn } from "@/lib/utils/cn";
import { useIsStudyMode } from "@/lib/utils/use-is-study-mode";
import { motion } from "framer-motion";
import { InfoIcon } from "lucide-react";
import { useEffect, useRef } from "react";

export function Feedback({
  feedbackFields,
  feedback,
  setFeedback,
}: {
  feedbackFields: FeedbackField[];
  feedback: Record<string, string | undefined>;
  setFeedback: (feedback: Record<string, string | undefined>) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStudyMode = useIsStudyMode();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedback]);

  const inFocusState = feedbackFields.every((field) => !feedback[field.label]);

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.4,
        }}
        className={cn(
          inFocusState && isStudyMode ? "shadow-focus" : "",
          "m-auto mb-4 space-y-3 rounded-lg border bg-white p-4",
        )}
      >
        {feedbackFields.map((field) => (
          <>
            {!isStudyMode ? (
              <FeedbackCheckbox
                key={field.label}
                feedbackField={field}
                feedback={feedback}
                setFeedback={setFeedback}
              />
            ) : (
              <>
                <FeedbackQuestion
                  key={field.label}
                  question={field.text}
                  tooltip={field.tooltip}
                />
                <div className="flex gap-2" key={`${field.label}-options`}>
                  {field.options.map((option) => (
                    <FeedbackButton
                      key={`${field.label}-option-${option}`}
                      isSelected={feedback[field.label] === option}
                      value={option}
                      variant={field.options.length > 3 ? "small" : "default"}
                      onClick={() =>
                        setFeedback({
                          ...feedback,
                          [field.label]:
                            feedback[field.label] === option
                              ? undefined
                              : option,
                        })
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ))}
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
              <InfoIcon className="!size-5 shrink-0" />
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
  feedbackField,
  feedback,
  setFeedback,
}: {
  feedbackField: FeedbackField;
  feedback: Record<string, string | undefined>;
  setFeedback: (feedback: Record<string, string | undefined>) => void;
}) {
  const isSelected = Boolean(feedback[feedbackField.label]);

  return (
    <Label className="flex items-center gap-3 rounded-lg border p-3 text-secondary has-[[aria-checked=true]]:border-black has-[[aria-checked=true]]:text-black">
      <Checkbox
        id={`toggle-${feedbackField.label}`}
        checked={isSelected}
        aria-checked={isSelected}
        onCheckedChange={(checked) => {
          setFeedback({
            ...feedback,
            [feedbackField.label]: checked
              ? feedbackField.options[0]
              : undefined,
          });
        }}
      />
      <div className="flex w-full items-center justify-between gap-1.5 font-normal">
        <p className="text-sm font-medium leading-none">{feedbackField.text}</p>
        {feedbackField.tooltip && (
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
                <InfoIcon className="!size-5 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              {feedbackField.tooltip}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </Label>
  );
}
