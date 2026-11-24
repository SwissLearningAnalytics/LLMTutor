import { useMutation } from "@tanstack/react-query";
import { CopyIcon, LinkIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createResumeCode } from "@/lib/api/tutor-sessions";

const RESUME_LINK_HINT =
  "Der Link ist 15 Minuten gültig und funktioniert nur einmal. Die Sitzung wird danach auf dem bisherigen Gerät beendet.";

function useResumeLink(tutorId: string, executionId: string) {
  return useMutation({
    mutationFn: async () => {
      const { code } = await createResumeCode({
        data: { tutorId, executionId },
      });
      return `${window.location.origin}/${encodeURIComponent(tutorId)}/resume#${code}`;
    },
  });
}

// lets the owner of a tutor hand a crashed session over to another device, e.g. on site
export function ResumeLink({
  tutorId,
  executionId,
}: {
  tutorId: string;
  executionId: string;
}) {
  const { mutate, data, isPending, isError } = useResumeLink(
    tutorId,
    executionId,
  );

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-primary bg-surface-primary p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-primary">
            Sitzung fortsetzen
          </h2>
          <p className="text-sm text-secondary">{RESUME_LINK_HINT}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => mutate()}
        >
          <LinkIcon />
          {data ? "Neuen Link erstellen" : "Fortsetzungslink erstellen"}
        </Button>
      </div>

      <ResumeLinkResult link={data} isError={isError} />
    </section>
  );
}

// the same in the list of conversations, so the teacher does not have to open the conversation first
export function ResumeLinkPopover({
  tutorId,
  executionId,
}: {
  tutorId: string;
  executionId: string;
}) {
  const { mutate, data, isPending, isError, reset } = useResumeLink(
    tutorId,
    executionId,
  );

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          mutate();
        } else {
          reset();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <LinkIcon />
          Fortsetzungslink
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        showArrow={false}
        className="flex flex-col gap-4 border border-border-primary bg-surface-primary text-primary"
      >
        <p className="text-sm text-secondary">{RESUME_LINK_HINT}</p>
        {isPending && <p className="text-sm text-secondary">Wird erstellt…</p>}
        <ResumeLinkResult link={data} isError={isError} />
      </PopoverContent>
    </Popover>
  );
}

function ResumeLinkResult({
  link,
  isError,
}: {
  link: string | undefined;
  isError: boolean;
}) {
  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Der Link konnte nicht erstellt werden.
      </p>
    );
  }

  if (!link) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QRCodeSVG value={link} size={160} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-surface-background-primary p-2 text-xs">
          {link}
        </code>
        <Button
          type="button"
          variant="ghost"
          aria-label="Link kopieren"
          onClick={() => navigator.clipboard.writeText(link)}
        >
          <CopyIcon />
        </Button>
      </div>
    </div>
  );
}
