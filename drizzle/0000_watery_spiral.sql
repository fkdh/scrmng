CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"manga_id" integer,
	"chapter_number" numeric(10, 2) NOT NULL,
	"title" varchar(500),
	"source_url" varchar(1000) NOT NULL,
	"total_images" integer DEFAULT 0,
	"downloaded_images" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chapters_manga_chapter_unique" UNIQUE("manga_id","chapter_number")
);
--> statement-breakpoint
CREATE TABLE "manga" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(100) NOT NULL,
	"source_url" varchar(1000) NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"thumbnail" varchar(1000),
	"author" varchar(500),
	"status" varchar(100),
	"genres" text[],
	"synopsis" text,
	"total_chapters" integer DEFAULT 0,
	"total_images" integer DEFAULT 0,
	"status_dl" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manga_source_slug_unique" UNIQUE("source","slug")
);
--> statement-breakpoint
CREATE TABLE "reading_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"manga_id" integer,
	"chapter_number" numeric(10, 2) NOT NULL,
	"last_image" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "history_user_manga_unique" UNIQUE("user_id","manga_id")
);
--> statement-breakpoint
CREATE TABLE "scrape_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(100) NOT NULL,
	"source_url" varchar(1000) NOT NULL,
	"manga_id" integer,
	"start_chapter" numeric(10, 2),
	"end_chapter" numeric(10, 2),
	"status" varchar(50) DEFAULT 'queued',
	"progress" integer DEFAULT 0,
	"total" integer DEFAULT 0,
	"current_chapter" varchar(200),
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'customer',
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chapters_manga" ON "chapters" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "idx_chapters_status" ON "chapters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_manga_source" ON "manga" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_manga_status" ON "manga" USING btree ("status_dl");--> statement-breakpoint
CREATE INDEX "idx_history_user" ON "reading_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_history_manga" ON "reading_history" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "scrape_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");