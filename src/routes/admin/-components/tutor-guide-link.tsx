import { BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TutorGuideLink() {
  return (
    <Button variant="neutral" asChild>
      <a
        href="https://learning-analytics.ch/anleitung-dozierende.html"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Anleitung Tutor erstellen"
        title="Anleitung Tutor erstellen"
      >
        <BookOpenIcon />
        <span className="hidden md:inline">Anleitung Tutor erstellen</span>
      </a>
    </Button>
  );
}
