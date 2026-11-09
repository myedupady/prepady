import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"name" varchar,
  	"step" varchar DEFAULT 'new',
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "whatsapp_sessions_id" integer;
  CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_sessions_phone_idx" ON "whatsapp_sessions" USING btree ("phone");
  CREATE INDEX IF NOT EXISTS "whatsapp_sessions_updated_at_idx" ON "whatsapp_sessions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "whatsapp_sessions_created_at_idx" ON "whatsapp_sessions" USING btree ("created_at");
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_whatsapp_sessions_fk" FOREIGN KEY ("whatsapp_sessions_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_whatsapp_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("whatsapp_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "whatsapp_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "whatsapp_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_whatsapp_sessions_fk";
  
  DROP INDEX "payload_locked_documents_rels_whatsapp_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "whatsapp_sessions_id";`)
}
