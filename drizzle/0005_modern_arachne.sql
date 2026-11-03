CREATE TABLE "t_ai_models" (
	"pk_ai_model_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"label" text,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "t_ai_models_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "t_tutors" ADD COLUMN "model_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "t_ai_models_single_default" ON "t_ai_models" USING btree ("is_default") WHERE "t_ai_models"."is_default";--> statement-breakpoint
ALTER TABLE "t_tutors" ADD CONSTRAINT "t_tutors_model_id_t_ai_models_pk_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."t_ai_models"("pk_ai_model_id") ON DELETE restrict ON UPDATE no action;