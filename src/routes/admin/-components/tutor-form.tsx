import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import slugify from "slugify";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createTutorOptions,
  updateTutorOptions,
} from "@/lib/api/tutors/mutation-options";
import { getOwnTutorsOptions } from "@/lib/api/tutors/query-options";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

const tutorFormSchema = z.object({
  tutorId: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1),
  learningObjectives: z.string().optional(),
  published: z.boolean(),
});

type TutorFormValues = z.infer<typeof tutorFormSchema>;

const defaultValues: TutorFormValues = {
  displayName: "",
  learningObjectives: undefined,
  prompt: "",
  published: false,
  tutorId: "",
};

type TutorFormProps =
  | {
      mode?: "create";
      defaultValues?: never;
      tutorId?: never;
    }
  | {
      mode: "edit";
      defaultValues: TutorFormValues;
      tutorId: string;
    };

export function TutorForm(props: TutorFormProps) {
  const isEdit = props.mode === "edit";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createMutation = useMutation(createTutorOptions());
  const updateMutation = useMutation(updateTutorOptions());
  const form = useForm({
    defaultValues: isEdit ? props.defaultValues : defaultValues,
    validators: { onSubmit: tutorFormSchema },
    onSubmit: async ({ value }) => {
      setSuccessMessage(null);

      if (isEdit) {
        const { tutorId: _tutorId, ...tutor } = value;
        await updateMutation.mutateAsync({
          data: { tutorId: props.tutorId, tutor },
        });
        await queryClient.invalidateQueries({
          queryKey: getOwnTutorsOptions().queryKey,
        });
        setSuccessMessage("Tutor aktualisiert.");
        return;
      }

      const createdTutor = await createMutation.mutateAsync({ data: value });
      await queryClient.invalidateQueries({
        queryKey: getOwnTutorsOptions().queryKey,
      });
      await navigate({
        to: "/admin/$tutorId",
        params: { tutorId: createdTutor.tutorId },
      });
    },
  });

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout
      header={
        <AdminHeader
          title={
            props.mode === "edit"
              ? `Tutor ${props.defaultValues.displayName} bearbeiten`
              : "Tutor erstellen"
          }
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
          <Link to="/admin">
            <ArrowLeftIcon />
            Zurück zu den Tutoren
          </Link>
        </Button>
        <form.Field name="published">
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
                disabled={isPending}
                checkIcon
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={field.name}>Veröffentlicht</FieldLabel>
                <FieldDescription>
                  Veröffentlichte Tutoren sind für Studierende zugänglich.
                </FieldDescription>
              </div>
            </Field>
          )}
        </form.Field>
        <form.Field name="displayName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Anzeigename</FieldLabel>
                <Input
                  type="text"
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    const displayName = e.target.value;
                    field.handleChange(displayName);

                    const tutorIdMeta = form.getFieldMeta("tutorId");
                    if (
                      !isEdit &&
                      !tutorIdMeta?.isTouched &&
                      !tutorIdMeta?.isDirty
                    ) {
                      form.setFieldValue(
                        "tutorId",
                        slugify(displayName, {
                          lower: true,
                          strict: true,
                          locale: "de",
                        }),
                        { dontUpdateMeta: true, dontValidate: true },
                      );
                    }
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="tutorId">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Tutor-ID</FieldLabel>
                <Input
                  type="text"
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    if (!isEdit) {
                      field.handleChange(e.target.value);
                    }
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  disabled={isEdit}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="prompt">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Systemprompt</FieldLabel>
                <Textarea
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="h-96 bg-surface-primary"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="learningObjectives">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Lernziele</FieldLabel>
                <Textarea
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="h-64 bg-surface-primary"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <Button type="submit" disabled={isPending}>
          {isEdit ? "Aktualisieren" : "Erstellen"}
        </Button>
        {successMessage && (
          <Badge variant="green" role="status" aria-live="polite">
            {successMessage}
          </Badge>
        )}
      </form>
    </Layout>
  );
}
