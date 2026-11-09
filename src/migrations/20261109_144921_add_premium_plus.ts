import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_plan" ADD VALUE IF NOT EXISTS 'premium-plus';
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "snap_uses_today" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "snap_uses_reset_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "voice_uses_today" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "voice_uses_reset_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "plan" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free'::text;
  DROP TYPE "public"."enum_users_plan";
  CREATE TYPE "public"."enum_users_plan" AS ENUM('free', 'premium');
  ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free'::"public"."enum_users_plan";
  ALTER TABLE "users" ALTER COLUMN "plan" SET DATA TYPE "public"."enum_users_plan" USING "plan"::"public"."enum_users_plan";
  ALTER TABLE "users" DROP COLUMN "snap_uses_today";
  ALTER TABLE "users" DROP COLUMN "snap_uses_reset_at";
  ALTER TABLE "users" DROP COLUMN "voice_uses_today";
  ALTER TABLE "users" DROP COLUMN "voice_uses_reset_at";`)
}
