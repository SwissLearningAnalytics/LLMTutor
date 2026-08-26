import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
  getErrorMessage,
  UserForm,
  type UserFormValues,
} from "@/routes/admin/-components/user-form";
import { requireAdminRole } from "@/routes/admin/-utils/admin-auth";

export const Route = createFileRoute("/admin/users/$userId")({
  beforeLoad: requireAdminRole,
  component: RouteComponent,
});

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

function RouteComponent() {
  const { userId } = Route.useParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const { data, error } = await authClient.admin.getUser({
        query: { id: userId },
      });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data as AdminUser | null;
    },
  });

  if (isLoading) {
    return <UserFormLoadingState />;
  }

  if (error || !data) {
    return <UserFormErrorState message={getErrorMessage(error)} />;
  }

  return (
    <UserForm mode="edit" userId={userId} defaultValues={toFormValues(data)} />
  );
}

function toFormValues(user: AdminUser): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role?.split(",").includes("admin") ? "admin" : "user",
  };
}

function UserFormLoadingState() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface-background-primary text-sm text-secondary">
      Benutzer wird geladen...
    </div>
  );
}

function UserFormErrorState({ message }: { message: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface-background-primary p-8 text-center">
      <div className="flex max-w-sm flex-col gap-1">
        <h1 className="text-lg font-semibold text-primary">
          Benutzer konnte nicht geladen werden
        </h1>
        <p className="text-sm text-secondary">{message}</p>
      </div>
    </div>
  );
}
