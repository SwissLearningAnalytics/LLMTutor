import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  deleteTutorOptions,
  updateTutorOptions,
} from "@/lib/api/tutors/mutation-options";
import {
  getOwnTutorOptions,
  getOwnTutorsOptions,
  getTutorOptions,
} from "@/lib/api/tutors/query-options";
import { authClient } from "@/lib/auth-client";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
  loader({ context: { queryClient } }) {
    queryClient.ensureQueryData(getOwnTutorsOptions());
  },
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: tutors } = useSuspenseQuery(getOwnTutorsOptions());
  const deleteMutation = useMutation(deleteTutorOptions());
  const publishMutation = useMutation(updateTutorOptions());
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = authClient.useSession();
  const canManageUsers = hasAdminRole(session?.user);
  const filteredTutors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return tutors;
    }

    return tutors.filter((tutor) => {
      return [tutor.displayName, tutor.tutorId].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [searchQuery, tutors]);

  async function deleteTutor(tutorId: string) {
    await deleteMutation.mutateAsync({ data: { tutorId } });
    queryClient.removeQueries({
      queryKey: getOwnTutorOptions(tutorId).queryKey,
    });
    queryClient.removeQueries({ queryKey: getTutorOptions(tutorId).queryKey });
    await queryClient.invalidateQueries({
      queryKey: getOwnTutorsOptions().queryKey,
    });
  }

  async function setPublished(tutorId: string, published: boolean) {
    const queryKey = getOwnTutorsOptions().queryKey;
    const previousTutors = queryClient.getQueryData(queryKey);

    queryClient.setQueryData(queryKey, (tutors) =>
      tutors?.map((tutor) =>
        tutor.tutorId === tutorId ? { ...tutor, published } : tutor,
      ),
    );

    try {
      await publishMutation.mutateAsync({
        data: { tutorId, tutor: { published } },
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previousTutors);
      throw error;
    }
  }

  return (
    <Layout
      header={
        <AdminHeader title="Tutoren">
          {canManageUsers && (
            <Button asChild>
              <Link to="/admin/users">
                <UserIcon />
                Benutzer verwalten
              </Link>
            </Button>
          )}
          <Button variant="destructive" asChild>
            <Link to="/admin/create">
              <PlusIcon />
              Tutor erstellen
            </Link>
          </Button>
        </AdminHeader>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-secondary"
          />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tutoren suchen"
            aria-label="Tutoren suchen"
            className="bg-surface-primary pl-10"
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-sm">
          {tutors.length > 0 ? (
            filteredTutors.length > 0 ? (
              <ul className="divide-y divide-border-primary">
                {filteredTutors.map((tutor) => (
                  <li key={tutor.tutorId} className="group relative">
                    <Link
                      to="/admin/$tutorId"
                      params={{ tutorId: tutor.tutorId }}
                      aria-label={`${tutor.displayName} bearbeiten`}
                      className="absolute inset-0 z-0 rounded-lg ring-offset-2 ring-inset focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
                    />
                    <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 p-4 transition-colors group-hover:bg-surface-background-primary">
                      <div className="pointer-events-none min-w-0">
                        <h2 className="truncate text-base font-medium text-primary">
                          {tutor.displayName}
                        </h2>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="pointer-events-auto relative z-20 flex items-center gap-2">
                          <Checkbox
                            id={`published-${tutor.tutorId}`}
                            checked={tutor.published}
                            disabled={
                              publishMutation.isPending &&
                              publishMutation.variables?.data.tutorId ===
                                tutor.tutorId
                            }
                            onCheckedChange={(checked) =>
                              setPublished(tutor.tutorId, checked === true)
                            }
                            checkIcon
                          />
                          <label
                            htmlFor={`published-${tutor.tutorId}`}
                            className="cursor-pointer text-sm text-primary"
                          >
                            Veröffentlicht
                          </label>
                        </div>
                        <DeleteTutorDialog
                          tutorId={tutor.tutorId}
                          displayName={tutor.displayName}
                          isDeleting={deleteMutation.isPending}
                          onDelete={deleteTutor}
                        />
                        <ChevronRightIcon
                          aria-hidden
                          className="size-4 text-secondary"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
                <h2 className="text-lg font-semibold text-primary">
                  Keine passenden Tutoren
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
                  Noch keine Tutoren
                </h2>
                <p className="text-sm text-secondary">
                  Erstelle den ersten Tutor, um loszulegen.
                </p>
              </div>
              <Button asChild>
                <Link to="/admin/create">
                  <PlusIcon />
                  Tutor erstellen
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function hasAdminRole(user: { role?: unknown } | undefined) {
  const roles = typeof user?.role === "string" ? user.role.split(",") : [];

  return roles.some((role) => role.trim() === "admin");
}

function DeleteTutorDialog({
  tutorId,
  displayName,
  isDeleting,
  onDelete,
}: {
  tutorId: string;
  displayName: string;
  isDeleting: boolean;
  onDelete: (tutorId: string) => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${displayName} löschen`}
          className="pointer-events-auto relative z-20 text-feedback-negative hover:bg-surface-feedback-negative-light hover:opacity-100"
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-lg border border-border-primary bg-surface-primary text-primary shadow-floating">
        <AlertDialogHeader>
          <AlertDialogTitle>Tutor löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dadurch wird {displayName} dauerhaft gelöscht. Diese Aktion kann
            nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="bg-surface-button-accent text-button-outline"
            onClick={() => onDelete(tutorId)}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
