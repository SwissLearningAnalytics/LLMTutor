import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import slugify from "slugify";
import { z } from "zod";
import { AutoResizingTextarea } from "@/components/ui/autoresizing-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createTutorOptions,
  updateTutorOptions,
} from "@/lib/api/tutors/mutation-options";
import {
  getTutorOptions,
  getTutorsOptions,
} from "@/lib/api/tutors/query-options";

const tutorFormSchema = z.object({
  tutorId: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1),
  learningObjectives: z.string().optional(),
});

type TutorFormValues = z.infer<typeof tutorFormSchema>;

const defaultValues: TutorFormValues = {
  displayName: "",
  learningObjectives: undefined,
  prompt: "",
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
        const updatedTutor = await updateMutation.mutateAsync({
          data: { tutorId: props.tutorId, tutor },
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getTutorsOptions().queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getTutorOptions(props.tutorId).queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getTutorOptions(updatedTutor.tutorId).queryKey,
          }),
        ]);
        setSuccessMessage("Tutor updated.");
        return;
      }

      const createdTutor = await createMutation.mutateAsync({ data: value });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getTutorsOptions().queryKey,
        }),
      ]);
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="mx-auto flex max-w-3xl flex-col gap-6 py-12"
    >
      <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
        <Link to="/admin">
          <ArrowLeftIcon data-icon="inline-start" />
          Back to tutors
        </Link>
      </Button>
      <h1 className="text-3xl font-semibold">
        {props.mode === "edit"
          ? `Edit Tutor ${props.defaultValues.displayName}`
          : "Create Tutor"}
      </h1>
      <form.Field name="displayName">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Displayname</FieldLabel>
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
              <FieldLabel htmlFor={field.name}>Tutor ID</FieldLabel>
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
              <FieldLabel htmlFor={field.name}>Prompt</FieldLabel>
              <AutoResizingTextarea
                name={field.name}
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                textareaClassName="min-h-32 rounded-md border bg-surface-primary p-2 text-sm ring-offset-surface-primary placeholder:text-secondary focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2"
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
              <FieldLabel htmlFor={field.name}>Learning objectives</FieldLabel>
              <AutoResizingTextarea
                name={field.name}
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                textareaClassName="min-h-24 rounded-md border bg-surface-primary p-2 text-sm ring-offset-surface-primary placeholder:text-secondary focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
      <Button type="submit" className="sticky bottom-6" disabled={isPending}>
        {isEdit ? "Update" : "Create"}
      </Button>
      {successMessage && (
        <Badge variant="green" role="status" aria-live="polite">
          {successMessage}
        </Badge>
      )}
    </form>
  );
}
