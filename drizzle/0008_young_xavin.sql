CREATE TABLE "t_tutor_sessions" (
	"execution_id" varchar(64) PRIMARY KEY NOT NULL,
	"tutor_id" text NOT NULL,
	"pseudonym" varchar(64) NOT NULL,
	"mode" text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"resume_code_hash" varchar(64),
	"resume_code_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "t_tutor_sessions" ADD CONSTRAINT "t_tutor_sessions_tutor_id_t_tutors_tutor_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."t_tutors"("tutor_id") ON DELETE cascade ON UPDATE cascade;