import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Idempotent (applied directly to the shared DB; clean on production too).
  await db.execute(sql`
  DO $$ BEGIN CREATE TYPE "public"."enum_video_lessons_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_partners_discount_type" AS ENUM('percent', 'fixed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_partners_revenue_share_type" AS ENUM('percent', 'fixed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_payments_status" AS ENUM('success', 'pending', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE TABLE IF NOT EXISTS "video_lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"exam_id" integer NOT NULL,
  	"subject_id" integer,
  	"topic_ref_id" integer,
  	"status" "enum_video_lessons_status" DEFAULT 'draft' NOT NULL,
  	"is_free" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"youtube_url" varchar NOT NULL,
  	"duration_label" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"profile_id" integer,
  	"active" boolean DEFAULT true,
  	"discount_type" "enum_partners_discount_type" DEFAULT 'percent',
  	"discount_value" numeric DEFAULT 0,
  	"revenue_share_type" "enum_partners_revenue_share_type" DEFAULT 'percent',
  	"revenue_share_value" numeric DEFAULT 0,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"email" varchar,
  	"plan_id" varchar,
  	"status" "enum_payments_status" DEFAULT 'success',
  	"base_amount" numeric,
  	"discount_amount" numeric DEFAULT 0,
  	"amount" numeric,
  	"partner_id" integer,
  	"partner_code" varchar,
  	"partner_profile_id" integer,
  	"partner_share_amount" numeric DEFAULT 0,
  	"paystack_customer_code" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partner_code" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "video_lessons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "partners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payments_id" integer;
  ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_topic_ref_id_topics_id_fk" FOREIGN KEY ("topic_ref_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_profile_id_users_id_fk" FOREIGN KEY ("partner_profile_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "video_lessons_exam_idx" ON "video_lessons" USING btree ("exam_id");
  CREATE INDEX "video_lessons_subject_idx" ON "video_lessons" USING btree ("subject_id");
  CREATE INDEX "video_lessons_topic_ref_idx" ON "video_lessons" USING btree ("topic_ref_id");
  CREATE INDEX "video_lessons_updated_at_idx" ON "video_lessons" USING btree ("updated_at");
  CREATE INDEX "video_lessons_created_at_idx" ON "video_lessons" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_code_idx" ON "partners" USING btree ("code");
  CREATE INDEX "partners_profile_idx" ON "partners" USING btree ("profile_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");
  CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");
  CREATE INDEX "payments_partner_idx" ON "payments" USING btree ("partner_id");
  CREATE INDEX "payments_partner_profile_idx" ON "payments" USING btree ("partner_profile_id");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_lessons_fk" FOREIGN KEY ("video_lessons_id") REFERENCES "public"."video_lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_video_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("video_lessons_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "video_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "video_lessons" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "payments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_video_lessons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payments_fk";
  
  DROP INDEX "payload_locked_documents_rels_video_lessons_id_idx";
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  DROP INDEX "payload_locked_documents_rels_payments_id_idx";
  ALTER TABLE "users" DROP COLUMN "partner_code";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "video_lessons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payments_id";
  DROP TYPE "public"."enum_video_lessons_status";
  DROP TYPE "public"."enum_partners_discount_type";
  DROP TYPE "public"."enum_partners_revenue_share_type";
  DROP TYPE "public"."enum_payments_status";`)
}
