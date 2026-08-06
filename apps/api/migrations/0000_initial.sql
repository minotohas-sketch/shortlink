-- Migration générée à la main à partir de apps/api/src/modules/auth/auth.schema.tst apps/api/src/modules/links/links.schema.ts (les DEUX SEULS fichiers *.schema.ts
-- non vides du repo — voir drizzle.config.ts : schema: './src/modules/**/*.schema.ts').
--
-- Ce fichier était présent mais VIDE (0 octet) dans le repo original : en l'état,
-- `wrangler d1 migrations apply` ne crée AUCUNE table. Ceci est une reconstruction
-- manuelle fidèle au schéma Drizzle actuel, à utiliser pour débloquer le projet.
-- Dès que le réseau/pnpm est disponible, relancer `pnpm db:generate` (drizzle-kit)
-- pour régénérer la migration officielle et la comparer à celle-ci.

CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`avatar_url` text,
	`provider` text DEFAULT 'email' NOT NULL,
	`provider_id` text,
	`referral_code` text NOT NULL,
	`referred_by` text,
	`last_login_at` text,
	`last_login_ip` text,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_idx` ON `users` (`referral_code`);
--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);
--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);
--> statement-breakpoint
CREATE INDEX `users_provider_idx` ON `users` (`provider`);
--> statement-breakpoint

CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`expires_at` text NOT NULL,
	`last_activity_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_refresh_token_idx` ON `sessions` (`refresh_token`);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);
--> statement-breakpoint

CREATE TABLE `email_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verifications_token_idx` ON `email_verifications` (`token`);
--> statement-breakpoint
CREATE INDEX `email_verifications_user_id_idx` ON `email_verifications` (`user_id`);
--> statement-breakpoint

CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_resets_token_idx` ON `password_resets` (`token`);
--> statement-breakpoint
CREATE INDEX `password_resets_user_id_idx` ON `password_resets` (`user_id`);
--> statement-breakpoint

CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_idx` ON `api_keys` (`key`);
--> statement-breakpoint
CREATE INDEX `api_keys_user_id_idx` ON `api_keys` (`user_id`);
--> statement-breakpoint

CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text REFERENCES `users`(`id`) ON DELETE set null,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`ip_address` text,
	`user_agent` text,
	`changes` text,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);
--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);
--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource`);
--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);
--> statement-breakpoint

CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`short_code` text NOT NULL,
	`original_url` text NOT NULL,
	`title` text,
	`description` text,
	`tags` text,
	`status` text DEFAULT 'active' NOT NULL,
	`type` text DEFAULT 'direct' NOT NULL,
	`domain_id` text,
	`custom_domain` text,
	`password` text,
	`expires_at` text,
	`max_clicks` integer,
	`current_clicks` integer DEFAULT 0 NOT NULL,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_short_code_idx` ON `links` (`short_code`);
--> statement-breakpoint
CREATE INDEX `links_user_id_idx` ON `links` (`user_id`);
--> statement-breakpoint
CREATE INDEX `links_status_idx` ON `links` (`status`);
--> statement-breakpoint
CREATE INDEX `links_domain_id_idx` ON `links` (`domain_id`);
--> statement-breakpoint
CREATE INDEX `links_created_at_idx` ON `links` (`created_at`);
--> statement-breakpoint
CREATE INDEX `links_expires_at_idx` ON `links` (`expires_at`);
--> statement-breakpoint

CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL REFERENCES `links`(`id`) ON DELETE cascade,
	`ip_address` text,
	`country` text,
	`country_code` text,
	`city` text,
	`region` text,
	`continent` text,
	`latitude` real,
	`longitude` real,
	`timezone` text,
	`device` text,
	`device_type` text,
	`browser` text,
	`browser_version` text,
	`os` text,
	`os_version` text,
	`referrer` text,
	`referrer_domain` text,
	`user_agent` text,
	`language` text,
	`screen_resolution` text,
	`unique_hash` text,
	`is_unique` integer DEFAULT 0 NOT NULL,
	`cpm_rate` real DEFAULT 0 NOT NULL,
	`earnings` real DEFAULT 0 NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clicks_link_id_idx` ON `clicks` (`link_id`);
--> statement-breakpoint
CREATE INDEX `clicks_country_code_idx` ON `clicks` (`country_code`);
--> statement-breakpoint
CREATE INDEX `clicks_device_type_idx` ON `clicks` (`device_type`);
--> statement-breakpoint
CREATE INDEX `clicks_created_at_idx` ON `clicks` (`created_at`);
--> statement-breakpoint
CREATE INDEX `clicks_unique_hash_idx` ON `clicks` (`unique_hash`);
--> statement-breakpoint

CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`domain` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`verification_token` text,
	`verification_method` text,
	`is_default` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ssl_enabled` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_domain_idx` ON `domains` (`domain`);
--> statement-breakpoint
CREATE INDEX `domains_user_id_idx` ON `domains` (`user_id`);
