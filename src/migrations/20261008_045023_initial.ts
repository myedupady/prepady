import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('student', 'admin');
  CREATE TYPE "public"."enum_users_plan" AS ENUM('free', 'premium');
  CREATE TYPE "public"."enum_exams_status" AS ENUM('active', 'draft');
  CREATE TYPE "public"."enum_subjects_exams" AS ENUM('waec', 'wassce', 'jamb', 'post-utme', 'neco', 'nabteb', 'bece-gh', 'npse', 'bssl', 'wasce-lr', 'gbce', 'kcpe', 'kcse', 'uneb-uce', 'uneb-uace', 'necta-psle', 'necta-csee', 'necta-acsee', 'rnec-primary', 'rnec-olevel', 'rnec-alevel', 'nebb', 'sece', 'nsc', 'get', 'zimsec-o', 'zimsec-a', 'ecz-g9', 'ecz-g12', 'maneb-jce', 'maneb-msce', 'bgcse', 'nssc', 'exco-jc', 'exco-cosc', 'egcse', 'moec', 'thanawiya', 'sudan-ssc', 'libya-bac', 'morocco-bac', 'tunisia-bac', 'algeria-bac', 'bac-senegal', 'bac-civ', 'bac-cameroon', 'gce-cameroon', 'bac-gabon', 'bac-drc', 'bac-congo', 'bac-mali', 'bac-burkina', 'bac-niger', 'bac-guinea', 'bac-togo', 'bac-benin', 'bac-chad', 'bac-car', 'bac-mauritania', 'seen', 'cape-verde', 'comoros-bac', 'madagascar-bac', 'mauritius-sc', 'mauritius-hsc', 'seychelles', 'reunion-bac');
  CREATE TYPE "public"."enum_questions_difficulty" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_questions_question_type" AS ENUM('mcq', 'theory');
  CREATE TYPE "public"."enum_quiz_sessions_mode" AS ENUM('practice', 'mock');
  CREATE TYPE "public"."enum_quiz_sessions_status" AS ENUM('active', 'completed', 'abandoned');
  CREATE TYPE "public"."enum_ai_controls_controls_provider" AS ENUM('anthropic', 'gemini');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'student' NOT NULL,
  	"plan" "enum_users_plan" DEFAULT 'free',
  	"subscription_expires_at" timestamp(3) with time zone,
  	"paystack_customer_code" varchar,
  	"ai_uses_today" numeric DEFAULT 0,
  	"ai_uses_reset_at" timestamp(3) with time zone,
  	"mark_uses_today" numeric DEFAULT 0,
  	"mark_uses_reset_at" timestamp(3) with time zone,
  	"email_verified" boolean DEFAULT false,
  	"email_verify_token" varchar,
  	"email_verify_expiry" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "regions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"color" varchar DEFAULT '#2563EB' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar,
  	"country" varchar NOT NULL,
  	"region_id" integer NOT NULL,
  	"status" "enum_exams_status" DEFAULT 'active' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subjects_exams" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_subjects_exams",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "subjects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"subject_id" integer NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_id" integer NOT NULL,
  	"subject_id" integer NOT NULL,
  	"topic_ref_id" integer,
  	"topic" varchar,
  	"difficulty" "enum_questions_difficulty" DEFAULT '2' NOT NULL,
  	"year" numeric,
  	"status" "enum_questions_status" DEFAULT 'draft' NOT NULL,
  	"question_type" "enum_questions_question_type" DEFAULT 'mcq' NOT NULL,
  	"question_text" varchar NOT NULL,
  	"question_image_id" integer,
  	"correct_answer" varchar,
  	"marking_scheme" varchar,
  	"max_marks" numeric DEFAULT 1,
  	"explanation" varchar,
  	"explanation_generated_by" varchar,
  	"video_solution_url" varchar,
  	"source_ref" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_sessions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_id" integer NOT NULL,
  	"question_snapshot" jsonb,
  	"given_answer" varchar,
  	"is_correct" boolean DEFAULT false,
  	"points_earned" numeric DEFAULT 0,
  	"answered_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "quiz_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"exam" varchar NOT NULL,
  	"subject_id" integer,
  	"mode" "enum_quiz_sessions_mode" DEFAULT 'practice',
  	"status" "enum_quiz_sessions_status" DEFAULT 'active' NOT NULL,
  	"total_questions" numeric NOT NULL,
  	"time_limit_minutes" numeric,
  	"current_difficulty" numeric DEFAULT 1,
  	"correct_streak" numeric DEFAULT 0,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"score" numeric DEFAULT 0,
  	"max_score" numeric DEFAULT 0,
  	"asked_question_ids" jsonb,
  	"subject_plan" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"regions_id" integer,
  	"exams_id" integer,
  	"subjects_id" integer,
  	"topics_id" integer,
  	"questions_id" integer,
  	"quiz_sessions_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "theme" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"background" varchar DEFAULT '#F6F2E9' NOT NULL,
  	"foreground" varchar DEFAULT '#201B15' NOT NULL,
  	"primary" varchar DEFAULT '#201B15' NOT NULL,
  	"primary_foreground" varchar DEFAULT '#F7F3EA' NOT NULL,
  	"accent" varchar DEFAULT '#F2A33C' NOT NULL,
  	"card" varchar DEFAULT '#FBF8F1' NOT NULL,
  	"border" varchar DEFAULT '#E7E0D2' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ai_controls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"controls_provider" "enum_ai_controls_controls_provider" DEFAULT 'anthropic',
  	"controls_auto_generate_explanations" boolean DEFAULT true,
  	"controls_monthly_budget_usd" numeric DEFAULT 25,
  	"controls_paused" boolean DEFAULT false,
  	"usage_current_month" varchar,
  	"usage_spend_usd" numeric,
  	"usage_explain_count" numeric,
  	"usage_auto_generated_count" numeric,
  	"usage_followup_count" numeric,
  	"usage_mark_count" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exams" ADD CONSTRAINT "exams_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subjects_exams" ADD CONSTRAINT "subjects_exams_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_options" ADD CONSTRAINT "questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_ref_id_topics_id_fk" FOREIGN KEY ("topic_ref_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_question_image_id_media_id_fk" FOREIGN KEY ("question_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_sessions_answers" ADD CONSTRAINT "quiz_sessions_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_sessions_answers" ADD CONSTRAINT "quiz_sessions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regions_fk" FOREIGN KEY ("regions_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exams_fk" FOREIGN KEY ("exams_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subjects_fk" FOREIGN KEY ("subjects_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_sessions_fk" FOREIGN KEY ("quiz_sessions_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "regions_slug_idx" ON "regions" USING btree ("slug");
  CREATE INDEX "regions_updated_at_idx" ON "regions" USING btree ("updated_at");
  CREATE INDEX "regions_created_at_idx" ON "regions" USING btree ("created_at");
  CREATE INDEX "exams_region_idx" ON "exams" USING btree ("region_id");
  CREATE INDEX "exams_updated_at_idx" ON "exams" USING btree ("updated_at");
  CREATE INDEX "exams_created_at_idx" ON "exams" USING btree ("created_at");
  CREATE INDEX "subjects_exams_order_idx" ON "subjects_exams" USING btree ("order");
  CREATE INDEX "subjects_exams_parent_idx" ON "subjects_exams" USING btree ("parent_id");
  CREATE UNIQUE INDEX "subjects_slug_idx" ON "subjects" USING btree ("slug");
  CREATE INDEX "subjects_updated_at_idx" ON "subjects" USING btree ("updated_at");
  CREATE INDEX "subjects_created_at_idx" ON "subjects" USING btree ("created_at");
  CREATE INDEX "topics_subject_idx" ON "topics" USING btree ("subject_id");
  CREATE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "questions_options_order_idx" ON "questions_options" USING btree ("_order");
  CREATE INDEX "questions_options_parent_id_idx" ON "questions_options" USING btree ("_parent_id");
  CREATE INDEX "questions_exam_idx" ON "questions" USING btree ("exam_id");
  CREATE INDEX "questions_subject_idx" ON "questions" USING btree ("subject_id");
  CREATE INDEX "questions_topic_ref_idx" ON "questions" USING btree ("topic_ref_id");
  CREATE INDEX "questions_question_image_idx" ON "questions" USING btree ("question_image_id");
  CREATE INDEX "questions_source_ref_idx" ON "questions" USING btree ("source_ref");
  CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");
  CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");
  CREATE INDEX "quiz_sessions_answers_order_idx" ON "quiz_sessions_answers" USING btree ("_order");
  CREATE INDEX "quiz_sessions_answers_parent_id_idx" ON "quiz_sessions_answers" USING btree ("_parent_id");
  CREATE INDEX "quiz_sessions_answers_question_idx" ON "quiz_sessions_answers" USING btree ("question_id");
  CREATE INDEX "quiz_sessions_user_idx" ON "quiz_sessions" USING btree ("user_id");
  CREATE INDEX "quiz_sessions_subject_idx" ON "quiz_sessions" USING btree ("subject_id");
  CREATE INDEX "quiz_sessions_updated_at_idx" ON "quiz_sessions" USING btree ("updated_at");
  CREATE INDEX "quiz_sessions_created_at_idx" ON "quiz_sessions" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_regions_id_idx" ON "payload_locked_documents_rels" USING btree ("regions_id");
  CREATE INDEX "payload_locked_documents_rels_exams_id_idx" ON "payload_locked_documents_rels" USING btree ("exams_id");
  CREATE INDEX "payload_locked_documents_rels_subjects_id_idx" ON "payload_locked_documents_rels" USING btree ("subjects_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("questions_id");
  CREATE INDEX "payload_locked_documents_rels_quiz_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_sessions_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "regions" CASCADE;
  DROP TABLE "exams" CASCADE;
  DROP TABLE "subjects_exams" CASCADE;
  DROP TABLE "subjects" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "questions_options" CASCADE;
  DROP TABLE "questions" CASCADE;
  DROP TABLE "quiz_sessions_answers" CASCADE;
  DROP TABLE "quiz_sessions" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "theme" CASCADE;
  DROP TABLE "ai_controls" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_plan";
  DROP TYPE "public"."enum_exams_status";
  DROP TYPE "public"."enum_subjects_exams";
  DROP TYPE "public"."enum_questions_difficulty";
  DROP TYPE "public"."enum_questions_status";
  DROP TYPE "public"."enum_questions_question_type";
  DROP TYPE "public"."enum_quiz_sessions_mode";
  DROP TYPE "public"."enum_quiz_sessions_status";
  DROP TYPE "public"."enum_ai_controls_controls_provider";`)
}
