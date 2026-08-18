import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                      aria-label={`Konversationen mit ${tutor.displayName} anzeigen`}
                      className="absolute inset-0 z-0 cursor-pointer rounded-lg ring-offset-2 ring-inset focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
                    />
                    <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 p-4 transition-colors group-hover:bg-surface-background-primary">
                      <div className="pointer-events-none min-w-0">
                        <h2 className="truncate text-base font-medium text-primary">
                          {tutor.displayName}
                        </h2>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <TutorPublicationStatus published={tutor.published} />
                        <TutorActions
                          tutor={tutor}
                          isPublishing={
                            publishMutation.isPending &&
                            publishMutation.variables?.data.tutorId ===
                              tutor.tutorId
                          }
                          isDeleting={deleteMutation.isPending}
                          onPublishedChange={setPublished}
                          onDelete={deleteTutor}
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

function TutorPublicationStatus({ published }: { published: boolean }) {
  const Icon = published ? EyeIcon : EyeOffIcon;
  const label = published ? "Veröffentlicht" : "Entwurf";

  return (
    <span className="flex items-center gap-2 px-2 text-sm text-secondary">
      <Icon aria-hidden className="size-4" />
      {label}
    </span>
  );
}

function TutorActions({
  tutor,
  isPublishing,
  isDeleting,
  onPublishedChange,
  onDelete,
}: {
  tutor: { tutorId: string; displayName: string; published: boolean };
  isPublishing: boolean;
  isDeleting: boolean;
  onPublishedChange: (tutorId: string, published: boolean) => Promise<void>;
  onDelete: (tutorId: string) => Promise<void>;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Aktionen für ${tutor.displayName}`}
            className="pointer-events-auto relative z-20"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-lg border-border-primary bg-surface-primary text-primary shadow-floating"
        >
          <DropdownMenuItem
            disabled={isPublishing}
            onSelect={(event) => {
              event.preventDefault();
              onPublishedChange(tutor.tutorId, !tutor.published);
            }}
          >
            {tutor.published ? <EyeOffIcon /> : <EyeIcon />}
            {tutor.published
              ? "Veröffentlichung aufheben"
              : "Tutor veröffentlichen"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border-primary" />
          <DropdownMenuItem asChild>
            <Link to="/admin/$tutorId/edit" params={{ tutorId: tutor.tutorId }}>
              <PencilIcon />
              Bearbeiten
            </Link>
          </DropdownMenuItem>
          {tutor.published ? (
            <DropdownMenuItem asChild>
              <Link to="/$tutor_id" params={{ tutor_id: tutor.tutorId }}>
                <ExternalLinkIcon />
                Öffentlichen Tutor öffnen
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <ExternalLinkIcon />
              Öffentlichen Tutor öffnen
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-border-primary" />
          <DropdownMenuItem
            className="text-feedback-negative focus:bg-surface-feedback-negative-light focus:text-feedback-negative"
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTutorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tutorId={tutor.tutorId}
        displayName={tutor.displayName}
        isDeleting={isDeleting}
        onDelete={onDelete}
      />
    </>
  );
}

function DeleteTutorDialog({
  open,
  onOpenChange,
  tutorId,
  displayName,
  isDeleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  displayName: string;
  isDeleting: boolean;
  onDelete: (tutorId: string) => Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
