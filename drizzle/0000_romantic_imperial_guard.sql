CREATE TABLE "t_messages" (
	"pk_message_id" serial PRIMARY KEY NOT NULL,
	"pseudonym" varchar(64) NOT NULL,
	"promptName" varchar(64) NOT NULL,
	"modelName" varchar(64) NOT NULL,
	"role" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"feedback" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
