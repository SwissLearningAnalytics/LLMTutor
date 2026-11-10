import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import slugify from "slugify";
import { z } from "zod";
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
import { getAiModelsOptions } from "@/lib/api/ai-models/query-options";
import {
  createTutorOptions,
  updateTutorOptions,
} from "@/lib/api/tutors/mutation-options";
import { getOwnTutorsOptions } from "@/lib/api/tutors/query-options";
import {
  annotationModeLabels,
  annotationScaleLabels,
  defaultAnnotationConfig,
} from "@/lib/feedback/annotations";
import {
  type AnnotationMode,
  type AnnotationScale,
  annotationConfigSchema,
} from "@/lib/feedback/types";
import { AdminLayout } from "@/routes/admin/-components/admin-layout";
import { AiModelCombobox } from "@/routes/admin/-components/ai-model-combobox";
import { MarkdownTextarea } from "@/routes/admin/-components/markdown-textarea";
import { SegmentedControl } from "@/routes/admin/-components/segmented-control";

const tutorFormSchema = z.object({
  tutorId: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1),
  learningObjectives: z.string().optional(),
  published: z.boolean(),
  modelId: z.number().int().nullable(),
  annotations: annotationConfigSchema,
});

type TutorFormValues = z.infer<typeof tutorFormSchema>;

const defaultValues: TutorFormValues = {
  displayName: "",
  learningObjectives: undefined,
  prompt: "",
  published: false,
  tutorId: "",
  modelId: null,
  annotations: defaultAnnotationConfig,
};

const annotationModeOptions = (
  Object.entries(annotationModeLabels) as [AnnotationMode, string][]
).map(([value, label]) => ({ value, label }));

const annotationScaleOptions = (
  Object.entries(annotationScaleLabels) as [AnnotationScale, string][]
).map(([value, label]) => ({ value, label }));

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
  const { data: aiModels } = useSuspenseQuery(getAiModelsOptions());
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
        // tutor counts per model may have changed
        await queryClient.invalidateQueries({
          queryKey: getAiModelsOptions().queryKey,
        });
        setSuccessMessage("Tutor aktualisiert.");
        return;
      }

      const createdTutor = await createMutation.mutateAsync({ data: value });
      await queryClient.invalidateQueries({
        queryKey: getOwnTutorsOptions().queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: getAiModelsOptions().queryKey,
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

  function renderAnnotationList(
    group: "ai" | "user",
    title: string,
    description: string,
  ) {
    return (
      <form.Field name={`annotations.${group}`} mode="array">
        {(listField) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{title}</p>
                <FieldDescription>{description}</FieldDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  listField.pushValue({
                    key: nanoid(10),
                    question: "",
                    tooltip: "",
                    scale: "yes-no",
                  })
                }
              >
                <PlusIcon />
                Hinzufügen
              </Button>
            </div>
            {listField.state.value.length === 0 && (
              <p className="text-sm text-secondary">Keine Fragen.</p>
            )}
            {listField.state.value.map((annotation, index) => (
              <div
                key={annotation.key}
                className="flex flex-col gap-4 overflow-hidden rounded-lg border bg-surface-primary p-4"
              >
                <div className="-mx-4 -mt-4 flex items-center justify-between gap-4 rounded-t-lg border-b bg-surface-background-primary py-1 pr-1 pl-4">
                  <p className="text-sm font-medium">Frage {index + 1}</p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Nach oben verschieben"
                      disabled={isPending || index === 0}
                      onClick={() => listField.moveValue(index, index - 1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Nach unten verschieben"
                      disabled={
                        isPending || index === listField.state.value.length - 1
                      }
                      onClick={() => listField.moveValue(index, index + 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Frage entfernen"
                      disabled={isPending}
                      onClick={() => listField.removeValue(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
                <form.Field name={`annotations.${group}[${index}].question`}>
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Frage</FieldLabel>
                        <Input
                          type="text"
                          name={field.name}
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          aria-invalid={isInvalid}
                          disabled={isPending}
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name={`annotations.${group}[${index}].tooltip`}>
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Tooltip</FieldLabel>
                      <Textarea
                        name={field.name}
                        id={field.name}
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isPending}
                        className="bg-surface-primary"
                      />
                      <FieldDescription>
                        Optional. Wird über das Info-Symbol neben der Frage
                        angezeigt.
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>
                <form.Field name={`annotations.${group}[${index}].scale`}>
                  {(field) => (
                    <Field>
                      <FieldLabel>Skala</FieldLabel>
                      <SegmentedControl
                        label="Skala"
                        options={annotationScaleOptions}
                        value={field.state.value}
                        onChange={field.handleChange}
                        disabled={isPending}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            ))}
          </div>
        )}
      </form.Field>
    );
  }

  return (
    <AdminLayout
      title={
        props.mode === "edit"
          ? `Tutor ${props.defaultValues.displayName} bearbeiten`
          : "Tutor erstellen"
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
        <form.Field name="modelId">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Modell</FieldLabel>
                <AiModelCombobox
                  id={field.name}
                  models={aiModels}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  disabled={isPending}
                  aria-invalid={isInvalid}
                />
                <FieldDescription>
                  Das Modell wird für alle Unterhaltungen mit diesem Tutor
                  verwendet.
                </FieldDescription>
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
                <MarkdownTextarea
                  label={
                    <FieldLabel htmlFor={field.name}>Systemprompt</FieldLabel>
                  }
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="h-96"
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
                <MarkdownTextarea
                  label={
                    <FieldLabel htmlFor={field.name}>Lernziele</FieldLabel>
                  }
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="h-64"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <div className="flex flex-col gap-6 border-t pt-6">
          <form.Field name="annotations.mode">
            {(field) => (
              <Field>
                <FieldLabel>Annotationen</FieldLabel>
                <SegmentedControl
                  label="Annotationen"
                  options={annotationModeOptions}
                  value={field.state.value}
                  onChange={field.handleChange}
                  disabled={isPending}
                />
                <FieldDescription>
                  Pflicht-Annotationen müssen beantwortet werden, um
                  fortzufahren. Freiwillige Ja/Nein-Fragen werden als Checkbox
                  angezeigt. Änderungen gelten für neu gestartete Sitzungen.
                </FieldDescription>
              </Field>
            )}
          </form.Field>
          {/* the questions are kept when switching to "Keine", so they come back when switching back */}
          <form.Subscribe selector={(state) => state.values.annotations.mode}>
            {(mode) =>
              mode !== "none" && (
                <>
                  {renderAnnotationList(
                    "ai",
                    "Nach Tutor-Nachricht",
                    "Fragen zur Nachricht des Tutors, bevor die Nutzer/in antwortet.",
                  )}
                  {renderAnnotationList(
                    "user",
                    "Nach eigener Antwort",
                    "Fragen zur eigenen Antwort, nachdem die Nutzer/in sie abgeschickt hat.",
                  )}
                </>
              )
            }
          </form.Subscribe>
        </div>
        <Button type="submit" disabled={isPending}>
          {isEdit ? "Aktualisieren" : "Erstellen"}
        </Button>
        {successMessage && (
          <Badge variant="green" role="status" aria-live="polite">
            {successMessage}
          </Badge>
        )}
      </form>
    </AdminLayout>
  );
}
