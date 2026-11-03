import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  deleteAiModelOptions,
  updateAiModelOptions,
} from "@/lib/api/ai-models/mutation-options";
import { getAiModelsOptions } from "@/lib/api/ai-models/query-options";
import { AdminHeader } from "@/routes/admin/-components/admin-header";
import { getAiModelErrorMessage } from "@/routes/admin/-components/ai-model-form";

export const Route = createFileRoute("/admin/models/")({
  loader({ context: { queryClient } }) {
    queryClient.ensureQueryData(getAiModelsOptions());
  },
  component: RouteComponent,
});

type AiModel = {
  id: number;
  name: string;
  label: string | null;
  isDefault: boolean;
  tutorCount: number;
};

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: models } = useSuspenseQuery(getAiModelsOptions());
  const updateMutation = useMutation(updateAiModelOptions());
  const deleteMutation = useMutation(deleteAiModelOptions());
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const filteredModels = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return models;
    }

    return models.filter((model) => {
      return [model.name, model.label ?? ""].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [searchQuery, models]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (error) {
      setError(getAiModelErrorMessage(error));
    } finally {
      await queryClient.invalidateQueries({
        queryKey: getAiModelsOptions().queryKey,
      });
    }
  }

  function setDefault(id: number) {
    return run(() =>
      updateMutation.mutateAsync({ data: { id, model: { isDefault: true } } }),
    );
  }

  function deleteModel(id: number) {
    return run(() => deleteMutation.mutateAsync({ data: { id } }));
  }

  return (
    <Layout
      header={
        <AdminHeader title="Modelle">
          <Button variant="destructive" asChild>
            <Link to="/admin/models/create">
              <PlusIcon />
              Modell erfassen
            </Link>
          </Button>
        </AdminHeader>
      }
    >
      <div className="flex flex-col gap-8">
        <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
          <Link to="/admin">
            <ArrowLeftIcon />
            Zurück zu den Tutoren
          </Link>
        </Button>

        <div className="relative">
          <SearchIcon
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-secondary"
          />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Modelle suchen"
            aria-label="Modelle suchen"
            className="bg-surface-primary pl-10"
          />
        </div>

        {error && <FieldError role="alert">{error}</FieldError>}

        <section className="overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-sm">
          {models.length > 0 ? (
            filteredModels.length > 0 ? (
              <ul className="divide-y divide-border-primary">
                {filteredModels.map((model) => (
                  <li key={model.id} className="group relative">
                    <Link
                      to="/admin/models/$modelId"
                      params={{ modelId: model.id }}
                      aria-label={`${model.name} bearbeiten`}
                      className="absolute inset-0 z-0 rounded-lg ring-offset-2 ring-inset focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
                    />
                    <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 p-4 transition-colors group-hover:bg-surface-background-primary">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="truncate text-base font-medium text-primary">
                            {model.label ?? model.name}
                          </h2>
                          {model.isDefault && (
                            <Badge variant="green">
                              <StarIcon className="-mr-1 size-4" />
                              Standard
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-secondary">
                          {model.label ? `${model.name} · ` : ""}
                          {formatTutorCount(model.tutorCount)}
                        </p>
                      </div>
                      <AiModelActions
                        model={model}
                        isPending={
                          updateMutation.isPending || deleteMutation.isPending
                        }
                        onSetDefault={setDefault}
                        onDelete={deleteModel}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
                <h2 className="text-lg font-semibold text-primary">
                  Keine passenden Modelle
                </h2>
                <p className="text-sm text-secondary">
                  Versuche einen anderen Suchbegriff.
                </p>
              </div>
            )
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">
                  Noch keine Modelle
                </h2>
                <p className="text-sm text-secondary">
                  Erfasse das erste Modell, um loszulegen.
                </p>
              </div>
              <Button asChild>
                <Link to="/admin/models/create">
                  <PlusIcon />
                  Modell erfassen
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function formatTutorCount(count: number) {
  if (count === 0) {
    return "Von keinem Tutor verwendet";
  }
  return `Von ${count} ${count === 1 ? "Tutor" : "Tutoren"} verwendet`;
}

function AiModelActions({
  model,
  isPending,
  onSetDefault,
  onDelete,
}: {
  model: AiModel;
  isPending: boolean;
  onSetDefault: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteBlockedReason = model.isDefault
    ? "Das Standardmodell kann nicht gelöscht werden."
    : model.tutorCount > 0
      ? "Das Modell wird von Tutoren verwendet."
      : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Aktionen für ${model.name}`}
            className="pointer-events-auto relative z-20 hover:bg-surface-background-tertiary hover:opacity-100 data-[state=open]:bg-surface-background-tertiary"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-lg border-border-primary bg-surface-primary text-primary shadow-floating"
        >
          <DropdownMenuItem
            disabled={isPending || model.isDefault}
            onSelect={() => onSetDefault(model.id)}
          >
            <StarIcon />
            Als Standard festlegen
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/models/$modelId" params={{ modelId: model.id }}>
              <PencilIcon />
              Bearbeiten
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border-primary" />
          <DropdownMenuItem
            disabled={isPending || deleteBlockedReason !== null}
            className="text-feedback-negative hover:bg-surface-feedback-negative-light focus:bg-surface-feedback-negative-light focus:text-feedback-negative"
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon />
            Löschen
          </DropdownMenuItem>
          {deleteBlockedReason && (
            <p className="px-2 pb-1.5 text-xs text-secondary">
              {deleteBlockedReason}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-lg border border-border-primary bg-surface-primary text-primary shadow-floating">
          <AlertDialogHeader>
            <AlertDialogTitle>Modell löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dadurch wird {model.name} aus der Modellauswahl entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-surface-button-accent text-button-outline"
              onClick={() => onDelete(model.id)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
