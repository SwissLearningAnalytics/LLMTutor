import { BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TutorGuideLink() {
  return (
    <Button variant="neutral" asChild>
      <a
        href="https://learning-analytics.ch/anleitung-dozierende.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        <BookOpenIcon />
        Anleitung Tutor erstellen
      </a>
    </Button>
  );
}
