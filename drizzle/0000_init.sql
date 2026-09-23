CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"dm_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dms" (
	"id" text PRIMARY KEY NOT NULL,
	"a" text NOT NULL,
	"b" text NOT NULL,
	"last_read_a" timestamp with time zone,
	"last_read_b" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'wave' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"peer_id" text NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"alias" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"fee_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'product' NOT NULL,
	"price_cents" integer NOT NULL,
	"promoted" boolean DEFAULT false NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" text DEFAULT 'message' NOT NULL,
	"target_id" text NOT NULL,
	"reason" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"language" text,
	"group" text DEFAULT 'adult' NOT NULL,
	"is_adult" boolean DEFAULT false NOT NULL,
	"premium" boolean DEFAULT false NOT NULL,
	"hue" integer DEFAULT 174 NOT NULL,
	CONSTRAINT "rooms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "top_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bought_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "top_slots_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"target_id" text,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"country" text DEFAULT 'IT' NOT NULL,
	"language" text DEFAULT 'it' NOT NULL,
	"age_group" text DEFAULT 'adult' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"wallet_cents" integer DEFAULT 0 NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"bio" text DEFAULT '' NOT NULL,
	"hue" integer DEFAULT 174 NOT NULL,
	"interests" text[] DEFAULT '{}' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verify_code" text DEFAULT '' NOT NULL,
	"verify_exp" timestamp with time zone,
	"plus" boolean DEFAULT false NOT NULL,
	"plus_renews_at" timestamp with time zone,
	"match_opt_in" boolean DEFAULT false NOT NULL,
	"adult_room_ok" boolean DEFAULT false NOT NULL,
	"show_video" boolean DEFAULT true NOT NULL,
	"public_profile" boolean DEFAULT true NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_nickname_unique" UNIQUE("nickname"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_pair_idx" ON "blocks" USING btree ("user_id","blocked_id");--> statement-breakpoint
CREATE INDEX "dm_messages_idx" ON "dm_messages" USING btree ("dm_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dms_pair_idx" ON "dms" USING btree ("a","b");--> statement-breakpoint
CREATE INDEX "match_reactions_idx" ON "match_reactions" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "matches_user_idx" ON "matches" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_room_idx" ON "messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "products_seller_idx" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "reports_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id","created_at");