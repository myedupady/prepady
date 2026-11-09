import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "questions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"exams_id" integer
  );
  
  DO $$ BEGIN ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_exams_fk" FOREIGN KEY ("exams_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "questions_rels_order_idx" ON "questions_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "questions_rels_parent_idx" ON "questions_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "questions_rels_path_idx" ON "questions_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "questions_rels_exams_id_idx" ON "questions_rels" USING btree ("exams_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "questions_rels" CASCADE;`)
}
