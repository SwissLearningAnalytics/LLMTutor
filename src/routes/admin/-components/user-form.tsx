import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, SaveIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

const userFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich."),
  email: z.email("Gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
  role: z.enum(["user", "admin"]),
});

const editUserFormSchema = userFormSchema.extend({
  password: z
    .string()
    .refine(
      (password) => password.length === 0 || password.length >= 8,
      "Das Passwort muss mindestens 8 Zeichen lang sein.",
    ),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormProps =
  | {
      mode: "create";
      defaultValues?: never;
      userId?: never;
    }
  | {
      mode: "edit";
      defaultValues: UserFormValues;
      userId: string;
    };

export function UserForm(props: UserFormProps) {
  const isEdit = props.mode === "edit";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm({
    defaultValues: isEdit
      ? props.defaultValues
      : {
          name: "",
          email: "",
          password: "",
          role: "user" as const,
        },
    validators: {
      onSubmit: isEdit ? editUserFormSchema : userFormSchema,
    },
    onSubmit: async ({ value }) => {
      setStatus(null);
      setIsPending(true);

      try {
        if (isEdit) {
          await updateUser(props.userId, value);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
            queryClient.invalidateQueries({
              queryKey: ["admin-user", props.userId],
            }),
          ]);
          setStatus({ type: "success", message: "Benutzer aktualisiert." });
          return;
        }

        const { error } = await authClient.admin.createUser({
          name: value.name,
          email: value.email,
          password: value.password,
          role: value.role,
        });

        if (error) {
          setStatus({ type: "error", message: getErrorMessage(error) });
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        await navigate({ to: "/admin/users" });
      } catch (error) {
        setStatus({ type: "error", message: getErrorMessage(error) });
      } finally {
        setIsPending(false);
      }
    },
  });

  const title = isEdit ? "Benutzer bearbeiten" : "Benutzer erstellen";

  return (
    <Layout header={<AdminHeader title={title} />}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
          <Link to="/admin/users">
            <ArrowLeftIcon />
            Zurück zu den Benutzern
          </Link>
        </Button>

        <section className="flex flex-col gap-6 rounded-lg border border-border-primary bg-surface-primary p-4 shadow-sm sm:p-6">
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>E-Mail</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Passwort</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="role">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Rolle</FieldLabel>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.target.value as "user" | "admin")
                    }
                    aria-invalid={isInvalid}
                    className="flex h-10 w-full rounded-md border bg-surface-primary p-2 text-sm ring-offset-surface-primary focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="user">Benutzer</option>
                    <option value="admin">Admin</option>
                  </select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={isPending} className="sm:w-fit">
              {isEdit ? <SaveIcon /> : <UserPlusIcon />}
              {isPending
                ? "Speichern..."
                : isEdit
                  ? "Benutzer speichern"
                  : "Benutzer erstellen"}
            </Button>
            {status?.type === "success" && (
              <Badge variant="green" role="status" aria-live="polite">
                {status.message}
              </Badge>
            )}
            {status?.type === "error" && (
              <FieldError role="alert">{status.message}</FieldError>
            )}
          </div>
        </section>
      </form>
    </Layout>
  );
}

async function updateUser(userId: string, value: UserFormValues) {
  const { error } = await authClient.admin.updateUser({
    userId,
    data: {
      name: value.name,
      email: value.email,
      role: value.role,
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!value.password) {
    return;
  }

  const passwordResult = await authClient.admin.setUserPassword({
    userId,
    newPassword: value.password,
  });

  if (passwordResult.error) {
    throw new Error(getErrorMessage(passwordResult.error));
  }
}

export function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return "Die Aktion konnte nicht abgeschlossen werden.";
  }

  return "Etwas ist schiefgelaufen.";
}
