ALTER TABLE "t_messages" ALTER COLUMN "promptName" SET DATA TYPE text;--> statement-breakpoint
-- remove orphaned messages of tutors deleted before the cascade existed, otherwise the foreign key cannot be added
DELETE FROM "t_messages" m
WHERE NOT EXISTS (SELECT 1 FROM "t_tutors" t WHERE t."tutor_id" = m."promptName");--> statement-breakpoint
ALTER TABLE "t_messages" ADD CONSTRAINT "t_messages_promptName_t_tutors_tutor_id_fk" FOREIGN KEY ("promptName") REFERENCES "public"."t_tutors"("tutor_id") ON DELETE cascade ON UPDATE cascade;
