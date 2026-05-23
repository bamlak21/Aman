CREATE TYPE "public"."role" AS ENUM('admin', 'super admin');--> statement-breakpoint
CREATE TYPE "public"."dispute_resolution" AS ENUM('refund_payer', 'release_payee', 'split', 'cancel');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('Pending', 'Negotiating', 'Resolved');--> statement-breakpoint
CREATE TYPE "public"."dispute_type" AS ENUM('non_delivery', 'quality_issue', 'fraud', 'breach_of_terms', 'other');--> statement-breakpoint
CREATE TYPE "public"."conditions" AS ENUM('manual', 'auto_after_date', 'milestone');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('created', 'funded', 'released', 'disputed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."txn_types" AS ENUM('deposit', 'release', 'refund', 'fee');--> statement-breakpoint
CREATE TABLE "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "chat-room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disputeId" uuid NOT NULL,
	"adminId" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat-room_disputeId_unique" UNIQUE("disputeId")
);
--> statement-breakpoint
CREATE TABLE "dispute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_id" uuid NOT NULL,
	"dispute_type" "dispute_type" DEFAULT 'other',
	"resolution" "dispute_resolution",
	"dispute_status" "dispute_status" DEFAULT 'Pending',
	"reason" text,
	"evidence_url" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount_cents" bigint NOT NULL,
	"status" "escrow_status" DEFAULT 'created' NOT NULL,
	"release_conditions" "conditions" DEFAULT 'manual',
	"expires_at" timestamp with time zone DEFAULT now() NOT NULL,
	"milestone_details" text,
	"tx_ref" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow_fund" (
	"escrow_id" uuid NOT NULL,
	"tx_ref" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_funded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'payee' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_id" uuid,
	"type" "txn_types" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"from_account" uuid,
	"to_account" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"admin_id" uuid,
	"token" varchar(512) NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatroomId" uuid NOT NULL,
	"senderId" uuid NOT NULL,
	"senderRole" varchar(20) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_role" SET DEFAULT 'payee'::text;--> statement-breakpoint
ALTER TABLE "escrow_parties" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "escrow_parties" ALTER COLUMN "role" SET DEFAULT 'payee'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('payee', 'payer');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_role" SET DEFAULT 'payee'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_role" SET DATA TYPE "public"."user_role" USING "user_role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "escrow_parties" ALTER COLUMN "role" SET DEFAULT 'payee'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "escrow_parties" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chat-room" ADD CONSTRAINT "chat-room_disputeId_dispute_id_fk" FOREIGN KEY ("disputeId") REFERENCES "public"."dispute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat-room" ADD CONSTRAINT "chat-room_adminId_admin_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_reported_id_users_id_fk" FOREIGN KEY ("reported_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_fund" ADD CONSTRAINT "escrow_fund_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_fund" ADD CONSTRAINT "escrow_fund_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_parties" ADD CONSTRAINT "escrow_parties_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_parties" ADD CONSTRAINT "escrow_parties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_account_users_id_fk" FOREIGN KEY ("from_account") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_account_users_id_fk" FOREIGN KEY ("to_account") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chatroomId_chat-room_id_fk" FOREIGN KEY ("chatroomId") REFERENCES "public"."chat-room"("id") ON DELETE no action ON UPDATE no action;