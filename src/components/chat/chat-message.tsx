import type { UIMessage } from "ai";
import { motion } from "motion/react";
import { MemoizedMarkdown } from "@/components/ui/memoized-markdown";
import { cn } from "@/lib/utils/cn";

type ChatMessageProps = {
  message: Pick<UIMessage, "id" | "role" | "parts">;
  blurAssistant?: boolean;
};

export function ChatMessage({
  message,
  blurAssistant = false,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <motion.div layout={false}>
        <div
          className={cn(
            "prose max-w-none! overflow-auto rounded-lg border border-primary bg-surface-feedback-neutral-light p-4 text-base leading-6",
            "ml-auto w-1/2",
          )}
        >
          <MemoizedMarkdown id={message.id} parts={message.parts} />
        </div>
      </motion.div>
    );
  }

  if (message.role === "assistant") {
    return (
      <motion.div layout={false}>
        <div
          className={cn(
            "prose mt-8 mb-4 max-w-full! overflow-auto rounded-lg border bg-white p-4 text-base leading-6 font-bold text-secondary shadow group-first:mt-0",
            blurAssistant && "blur-sm",
          )}
        >
          <MemoizedMarkdown id={message.id} parts={message.parts} />
        </div>
      </motion.div>
    );
  }

  return null;
}
