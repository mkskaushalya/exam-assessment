CREATE TYPE "public"."exam_session_status" AS ENUM('in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."paper_type" AS ENUM('past_paper', 'model_paper', 'ai_predicted');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'bank_transfer', 'mobile_payment');--> statement-breakpoint
CREATE TYPE "public"."question_complexity" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'student');--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"paper_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"score_pct" numeric(5, 2),
	"status" "exam_session_status" DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject" text NOT NULL,
	"language" text NOT NULL,
	"exam_board" text NOT NULL,
	"type" "paper_type" NOT NULL,
	"year" integer NOT NULL,
	"price_lkr" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"paper_id" text NOT NULL,
	"amount_paid_lkr" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_ref" text NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_user_paper_unique" UNIQUE("user_id","paper_id")
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" integer DEFAULT 0 NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"paper_id" text NOT NULL,
	"question_text" text NOT NULL,
	"explanation_text" text DEFAULT '' NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"complexity" "question_complexity" DEFAULT 'medium' NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option_id" text,
	"is_correct" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_answers_session_question_unique" UNIQUE("session_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_selected_option_id_question_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_sessions_user_id_idx" ON "exam_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_paper_id_idx" ON "exam_sessions" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "papers_subject_idx" ON "papers" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "papers_exam_board_idx" ON "papers" USING btree ("exam_board");--> statement-breakpoint
CREATE INDEX "papers_type_idx" ON "papers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "question_options_question_id_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_paper_id_idx" ON "questions" USING btree ("paper_id");--> statement-breakpoint
CREATE INDEX "session_answers_session_id_idx" ON "session_answers" USING btree ("session_id");