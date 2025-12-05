import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AiModels, providerName } from "@/lib/ai/model";
import { usePseudonymStore } from "@/lib/pseudonymStore";
import { getTutor, tutorIds } from "@/tutors";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { InfoIcon } from "lucide-react";
import { useEffect, useRef } from "react";

type Search = {
  model?: string;
};

export const Route = createFileRoute("/$tutor_id/")({
  component: RouteComponent,
  beforeLoad: ({ params }) => {
    if (!tutorIds.includes(params.tutor_id)) {
      throw notFound();
    }
  },
  loader: async ({ params }) => {
    const t = await getTutor(params.tutor_id);
    console.log(t);
    return t;
  },
  validateSearch: (search: Record<string, string>): Search => {
    if (search.model) {
      if (import.meta.env.MODE === "prod") {
        console.warn("Models can only be configured in the dev environment.");

        return { model: undefined };
      }

      if (!AiModels[providerName].includes(search.model)) {
        if (typeof window !== "undefined") {
          alert(
            `Model ${search.model} is not supported. Supported models are: ${AiModels[providerName].join(", ")}`,
          );
        }
        return { model: undefined };
      }
    }

    return {
      model: search.model,
    };
  },
});

function RouteComponent() {
  const { pseudonym, setPseudonym } = usePseudonymStore();
  const navigate = Route.useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const tutorId = Route.useParams({
    select: (params) => params.tutor_id,
  });
  const tutor = Route.useLoaderData();
  const { model } = Route.useSearch();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toTutorOptions = {
    to: "/$tutor_id/tutor",
    params: { tutor_id: tutorId },
    search: {
      model,
    },
  };

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey && pseudonym) {
      e.preventDefault();
      navigate(toTutorOptions);
    }
  }
  return (
    <Layout flex header={""}>
      <Card
        variant="question"
        className="mx-auto my-auto flex w-full flex-col justify-center"
      >
        <CardContent className="p-6">
          <div className="flex w-full flex-col">
            <h1 className="mb-6 text-xl font-extrabold">
              Sokratischer Tutor – {tutor?.displayName}
            </h1>

            <Label
              htmlFor="audience"
              className="mb-1 flex items-center gap-1 text-base font-bold leading-none"
            >
              <div>Pseudonym</div>
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
                  <div className="mb-6 text-base font-normal">
                    Notieren Sie bitte zuerst die beiden ersten Buchstaben des
                    Namens Ihres Vaters, dann die ersten beiden Buchstaben des
                    Namens Ihrer Mutter, verwenden Sie dafür bitte nur
                    Kleinbuchstaben. Dann notieren Sie bitte noch den Tag Ihrer
                    Geburt (ohne Monat und Jahr). Wenn Sie also am 22 Mai
                    geboren sind, dann notieren Sie 22. Zum Schluss notieren Sie
                    bitte noch die ersten beiden Buchstaben Ihres Wohnortes als
                    Sie geboren wurden.&nbsp;
                    <br />
                    <br />
                    Hier als Beispiel die Angaben einer fiktiven Studentin:
                    <br />
                    <br />
                    Vater: <span className="text-feedback-positive">Al</span>
                    bert
                    <br />
                    Mutter: <span className="text-feedback-positive">Li</span>
                    na
                    <br />
                    Geburtsdatum:{" "}
                    <span className="text-feedback-positive">06</span>
                    .05.1995
                    <br />
                    Wohnort bei der Geburt:{" "}
                    <span className="text-feedback-positive">Ot</span>
                    hmarsingen
                    <br />
                    Pseudonym:{" "}
                    <span className="text-feedback-positive">alli06ot</span>
                  </div>
                </PopoverContent>
              </Popover>
            </Label>
            <Input
              ref={inputRef}
              type="text"
              id="audience"
              className="max-w-60 text-xs font-normal disabled:bg-surface-feedback-neutral-light disabled:opacity-100"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              required
              onKeyDown={handleEnter}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end py-3">
          <Link {...toTutorOptions}>
            <Button disabled={pseudonym === ""} variant={"destructive"}>
              Start
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </Layout>
  );
}
