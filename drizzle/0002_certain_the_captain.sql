CREATE TABLE `seating_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`invitation_code` text NOT NULL,
	`table_name` text NOT NULL,
	`seat_note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `seating_guests_normalized_name_idx` ON `seating_guests` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `seating_guests_invitation_code_idx` ON `seating_guests` (`invitation_code`);