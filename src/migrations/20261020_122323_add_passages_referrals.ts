import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Written idempotently: the shared dev DB already received some of these
  // columns via an earlier direct ALTER, while production is a clean slate.
  // IF NOT EXISTS / guarded blocks let this apply cleanly to both.
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_passages_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE TABLE IF NOT EXISTS "passages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"exam_id" integer NOT NULL,
  	"subject_id" integer,
  	"status" "enum_passages_status" DEFAULT 'draft' NOT NULL,
  	"year" numeric,
  	"order" numeric DEFAULT 0,
  	"instructions" varchar,
  	"passage" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_count" numeric DEFAULT 0;
  ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "passage_id" integer;
  ALTER TABLE "quiz_sessions_answers" ADD COLUMN IF NOT EXISTS "subject_name" varchar;
  ALTER TABLE "quiz_sessions_answers" ADD COLUMN IF NOT EXISTS "topic_name" varchar;
  ALTER TABLE "quiz_sessions" ADD COLUMN IF NOT EXISTS "topic_ref_id" integer;
  ALTER TABLE "quiz_sessions" ADD COLUMN IF NOT EXISTS "past_year" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "passages_id" integer;

  DO $$ BEGIN
    ALTER TABLE "passages" ADD CONSTRAINT "passages_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "passages" ADD CONSTRAINT "passages_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_topic_ref_id_topics_id_fk" FOREIGN KEY ("topic_ref_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passages_fk" FOREIGN KEY ("passages_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "passages_exam_idx" ON "passages" USING btree ("exam_id");
  CREATE INDEX IF NOT EXISTS "passages_subject_idx" ON "passages" USING btree ("subject_id");
  CREATE INDEX IF NOT EXISTS "passages_updated_at_idx" ON "passages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "passages_created_at_idx" ON "passages" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_idx" ON "users" USING btree ("referral_code");
  CREATE INDEX IF NOT EXISTS "questions_passage_idx" ON "questions" USING btree ("passage_id");
  CREATE INDEX IF NOT EXISTS "quiz_sessions_topic_ref_idx" ON "quiz_sessions" USING btree ("topic_ref_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_passages_id_idx" ON "payload_locked_documents_rels" USING btree ("passages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "passages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "passages" CASCADE;
  ALTER TABLE "questions" DROP CONSTRAINT "questions_passage_id_passages_id_fk";
  
  ALTER TABLE "quiz_sessions" DROP CONSTRAINT "quiz_sessions_topic_ref_id_topics_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_passages_fk";
  
  DROP INDEX "users_referral_code_idx";
  DROP INDEX "questions_passage_idx";
  DROP INDEX "quiz_sessions_topic_ref_idx";
  DROP INDEX "payload_locked_documents_rels_passages_id_idx";
  ALTER TABLE "users" DROP COLUMN "referral_code";
  ALTER TABLE "users" DROP COLUMN "referred_by";
  ALTER TABLE "users" DROP COLUMN "referral_count";
  ALTER TABLE "questions" DROP COLUMN "passage_id";
  ALTER TABLE "quiz_sessions_answers" DROP COLUMN "subject_name";
  ALTER TABLE "quiz_sessions_answers" DROP COLUMN "topic_name";
  ALTER TABLE "quiz_sessions" DROP COLUMN "topic_ref_id";
  ALTER TABLE "quiz_sessions" DROP COLUMN "past_year";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "passages_id";
  DROP TYPE "public"."enum_passages_status";`)
}
