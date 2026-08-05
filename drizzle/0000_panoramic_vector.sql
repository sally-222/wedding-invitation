CREATE TABLE `blessing_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`blessing_id` text NOT NULL,
	`author_name` text DEFAULT '' NOT NULL,
	`display_name` text NOT NULL,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`blessing_id`) REFERENCES `blessings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `blessings` (
	`id` text PRIMARY KEY NOT NULL,
	`author_name` text DEFAULT '' NOT NULL,
	`display_name` text NOT NULL,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
