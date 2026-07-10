import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { AdminHeader } from "@/routes/admin/-components/admin-header";
import { getErrorMessage } from "@/routes/admin/-components/user-form";
import { requireAdminRole } from "@/routes/admin/-utils/admin-auth";

export const Route = createFileRoute("/admin/users/")({
  beforeLoad: requireAdminRole,
  component: RouteComponent,
});

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: Date | string;
};

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 100,
          sortBy: "name",
          sortDirection: "asc",
        },
      });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data;
    },
  });
  const users = (data?.users ?? []) as AdminUser[];
  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      return [user.name, user.email, user.role ?? "user"].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [searchQuery, users]);

  return (
    <Layout
      header={
        <AdminHeader title="Benutzer">
          <Button variant="destructive" asChild>
            <Link to="/admin/users/create">
              <PlusIcon data-icon="inline-start" />
              Benutzer erstellen
            </Link>
          </Button>
        </AdminHeader>
      }
    >
      <div className="flex flex-col gap-8">
        <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
          <Link to="/admin">
            <ArrowLeftIcon data-icon="inline-start" />
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
            placeholder="Benutzer suchen"
            aria-label="Benutzer suchen"
            className="bg-surface-primary pl-10"
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-sm">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center p-8 text-sm text-secondary">
              Benutzer werden geladen...
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
              <h2 className="text-lg font-semibold text-primary">
                Benutzer konnten nicht geladen werden
              </h2>
              <p className="text-sm text-secondary">{getErrorMessage(error)}</p>
            </div>
          ) : users.length > 0 ? (
            filteredUsers.length > 0 ? (
              <ul className="divide-y divide-border-primary">
                {filteredUsers.map((user) => (
                  <li key={user.id} className="group relative">
                    <Link
                      to="/admin/users/$userId"
                      params={{ userId: user.id }}
                      aria-label={`${user.name} bearbeiten`}
                      className="absolute inset-0 z-0 rounded-lg ring-offset-2 ring-inset focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
                    />
                    <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 p-4 transition-colors group-hover:bg-surface-background-primary">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="truncate text-base font-medium text-primary">
                            {user.name}
                          </h2>
                          <UserRoleBadge role={user.role} />
                        </div>
                        <p className="truncate text-sm text-secondary">
                          {user.email}
                        </p>
                      </div>
                      <ChevronRightIcon
                        aria-hidden
                        className="size-4 shrink-0 text-secondary"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
                <h2 className="text-lg font-semibold text-primary">
                  Keine passenden Benutzer
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
                  Noch keine Benutzer
                </h2>
                <p className="text-sm text-secondary">
                  Erstelle den ersten Benutzer, um loszulegen.
                </p>
              </div>
              <Button asChild>
                <Link to="/admin/users/create">
                  <PlusIcon data-icon="inline-start" />
                  Benutzer erstellen
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function UserRoleBadge({ role }: { role?: string | null }) {
  const normalizedRole = role?.trim() || "user";
  const isAdmin = normalizedRole.split(",").includes("admin");

  return (
    <Badge variant={isAdmin ? "green" : "gray"}>
      {isAdmin ? (
        <ShieldIcon className="-mr-1 size-4" data-icon="inline-start" />
      ) : (
        <UserIcon className="-mr-1 size-4" data-icon="inline-start" />
      )}
      {isAdmin ? "Admin" : "Benutzer"}
    </Badge>
  );
}
