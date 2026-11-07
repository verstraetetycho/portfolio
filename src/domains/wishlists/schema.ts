import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "@/global/schema";

export const wishlists = pgTable("wishlists", {
	id: uuid().primaryKey().defaultRandom(),
	title: text().notNull(),
	// Link for friends; null = not shared. Stored as-is (not hashed) so the
	// link can be copied again. It only grants viewing and claiming this list.
	shareToken: text("share_token").unique(),
	createdAt: timestamptz("created_at").notNull().defaultNow(),
});

export const wishlistItems = pgTable("wishlist_items", {
	id: uuid().primaryKey().defaultRandom(),
	wishlistId: uuid("wishlist_id")
		.notNull()
		.references(() => wishlists.id, { onDelete: "cascade" }),
	name: text().notNull(),
	url: text(),
	priceCents: integer("price_cents"), // EUR
	note: text(),
	imageKey: text("image_key"), // object key in the wishlist-images bucket
	// SHA-256 of the claiming friend's secret; null = unclaimed.
	// Never sent to the owner: claims stay a surprise.
	claimHash: text("claim_hash"),
	createdAt: timestamptz("created_at").notNull().defaultNow(),
});
