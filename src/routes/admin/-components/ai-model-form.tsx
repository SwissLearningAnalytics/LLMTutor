import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createAiModelOptions,
  updateAiModelOptions,
} from "@/lib/api/ai-models/mutation-options";
import { getAiModelsOptions } from "@/lib/api/ai-models/query-options";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

const aiModelFormSchema = z.object({
  name: z.string().trim().min(1, "Modell-ID ist erforderlich.").max(64),
  label: z.string(),
  isDefault: z.boolean(),
});

type AiModelFormValues = z.infer<typeof aiModelFormSchema>;

type AiModelFormProps =
  | {
      mode: "create";
      defaultValues?: never;
      modelId?: never;
    }
  | {
      mode: "edit";
      defaultValues: AiModelFormValues;
      modelId: number;
    };

export function AiModelForm(props: AiModelFormProps) {
  const isEdit = props.mode === "edit";
  // the default can only be changed by making another model the default
  const isCurrentDefault = isEdit && props.defaultValues.isDefault;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const createMutation = useMutation(createAiModelOptions());
  const updateMutation = useMutation(updateAiModelOptions());
  const form = useForm({
    defaultValues: isEdit
      ? props.defaultValues
      : { name: "", label: "", isDefault: false },
    validators: { onSubmit: aiModelFormSchema },
    onSubmit: async ({ value }) => {
      setStatus(null);

      try {
        if (isEdit) {
          await updateMutation.mutateAsync({
            data: { id: props.modelId, model: value },
          });
          await queryClient.invalidateQueries({
            queryKey: getAiModelsOptions().queryKey,
          });
          setStatus({ type: "success", message: "Modell aktualisiert." });
          return;
        }

        await createMutation.mutateAsync({ data: value });
        await queryClient.invalidateQueries({
          queryKey: getAiModelsOptions().queryKey,
        });
        await navigate({ to: "/admin/models" });
      } catch (error) {
        setStatus({ type: "error", message: getAiModelErrorMessage(error) });
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const title = isEdit ? "Modell bearbeiten" : "Modell erfassen";

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
          <Link to="/admin/models">
            <ArrowLeftIcon />
            Zurück zu den Modellen
          </Link>
        </Button>

        <section className="flex flex-col gap-6 rounded-lg border border-border-primary bg-surface-primary p-4 shadow-sm sm:p-6">
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Modell-ID</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="off"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <FieldDescription>
                    Die ID, unter der der Anbieter das Modell führt, z.B.
                    gpt-5.4.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="label">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Bezeichnung</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  Optional. Wird in der Modellauswahl angezeigt.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          <form.Field name="isDefault">
            {(field) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  onBlur={field.handleBlur}
                  disabled={isPending || isCurrentDefault}
                  checkIcon
                />
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={field.name}>Standardmodell</FieldLabel>
                  <FieldDescription>
                    {isCurrentDefault
                      ? "Um das Standardmodell zu ändern, lege ein anderes Modell als Standard fest."
                      : "Tutoren ohne eigenes Modell verwenden das Standardmodell."}
                  </FieldDescription>
                </div>
              </Field>
            )}
          </form.Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={isPending} className="sm:w-fit">
              {isEdit ? <SaveIcon /> : <PlusIcon />}
              {isPending
                ? "Speichern..."
                : isEdit
                  ? "Modell speichern"
                  : "Modell erfassen"}
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

export function getAiModelErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Etwas ist schiefgelaufen.";
}
