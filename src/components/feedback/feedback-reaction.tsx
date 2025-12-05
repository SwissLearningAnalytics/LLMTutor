import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

export function FeedbackReaction() {
  return (
    <motion.div
      key="feedback-reaction"
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.5 }}
      transition={{ duration: 0.5 }}
      className={cn("mx-auto mt-2")}
    >
      <Badge variant="green">Danke für das Feedback!</Badge>
    </motion.div>
  );
}
