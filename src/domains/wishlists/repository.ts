import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth } from "@/global/auth";
import { db } from "@/global/db";
import { PublicError } from "@/global/server-fn";
import { images } from "./images";
import { ProductPage } from "./product";
import { wishlistItems, wishlists } from "./schema";

type ItemInput = Omit<typeof wishlistItems.$inferInsert, "wishlistId">;

// Item fields anyone may see. No claimHash: the owner never learns about claims.
const itemFields = {
	id: wishlistItems.id,
	name: wishlistItems.name,
	url: wishlistItems.url,
	priceCents: wishlistItems.priceCents,
	note: wishlistItems.note,
	imageKey: wishlistItems.imageKey,
};

// Everything the owner does. Callers must be behind the `authed` middleware.
class WishlistRepository {
	list() {
		return db()
			.select({
				id: wishlists.id,
				title: wishlists.title,
				shareToken: wishlists.shareToken,
				itemCount: count(wishlistItems.id),
			})
			.from(wishlists)
			.leftJoin(wishlistItems, eq(wishlistItems.wishlistId, wishlists.id))
			.groupBy(wishlists.id)
			.orderBy(desc(wishlists.createdAt));
	}

	async get(id: string) {
		const [wishlist] = await db()
			.select({
				id: wishlists.id,
				title: wishlists.title,
				shareToken: wishlists.shareToken,
			})
			.from(wishlists)
			.where(eq(wishlists.id, id));
		if (!wishlist) throw new PublicError("Wishlist not found");
		const items = await db()
			.select(itemFields)
			.from(wishlistItems)
			.where(eq(wishlistItems.wishlistId, id))
			.orderBy(asc(wishlistItems.createdAt));
		return { ...wishlist, items };
	}

	async create(data: { title: string }) {
		const [created] = await db()
			.insert(wishlists)
			.values(data)
			.returning({ id: wishlists.id });
		return created.id;
	}

	async rename(id: string, title: string) {
		await db().update(wishlists).set({ title }).where(eq(wishlists.id, id));
	}

	async delete(id: string) {
		const items = await db()
			.delete(wishlistItems)
			.where(eq(wishlistItems.wishlistId, id))
			.returning({ imageKey: wishlistItems.imageKey });
		await db().delete(wishlists).where(eq(wishlists.id, id));
		await images.delete(items.map((item) => item.imageKey));
	}

	// Creates the share link, or replaces it (the old link stops working).
	async share(id: string) {
		const shareToken = randomBytes(32).toString("base64url");
		await db()
			.update(wishlists)
			.set({ shareToken })
			.where(eq(wishlists.id, id));
		return shareToken;
	}

	async unshare(id: string) {
		await db()
			.update(wishlists)
			.set({ shareToken: null })
			.where(eq(wishlists.id, id));
	}

	async addItem(wishlistId: string, item: ItemInput) {
		await db()
			.insert(wishlistItems)
			.values({ ...item, wishlistId });
	}

	async updateItem(id: string, item: ItemInput) {
		const [old] = await db()
			.select({ imageKey: wishlistItems.imageKey })
			.from(wishlistItems)
			.where(eq(wishlistItems.id, id));
		await db().update(wishlistItems).set(item).where(eq(wishlistItems.id, id));
		if (old && old.imageKey !== item.imageKey)
			await images.delete([old.imageKey]);
	}

	async deleteItem(id: string) {
		const deleted = await db()
			.delete(wishlistItems)
			.where(eq(wishlistItems.id, id))
			.returning({ imageKey: wishlistItems.imageKey });
		await images.delete(deleted.map((item) => item.imageKey));
	}

	// Name, price (EUR) and image from a product page. Only for the owner: an
	// open version would let anyone use this site as a proxy.
	async fetchProduct(url: string) {
		let product: ProductPage;
		try {
			product = await ProductPage.fetch(url);
		} catch (error) {
			console.error(error);
			throw new PublicError(
				"Couldn't read that page. Fill in the details yourself.",
			);
		}
		const { imageUrl, ...details } = product.toJSON();
		return {
			...details,
			imageKey: imageUrl && (await this.#storeImage(imageUrl)),
		};
	}

	// A missing or broken image shouldn't fail the whole autofill.
	async #storeImage(imageUrl: string) {
		try {
			const res = await ProductPage.request(imageUrl, "image/*");
			if (!res.ok) return null;
			return await images.putResponse(res);
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}

// Everything a friend with the share link does.
class SharedWishlistRepository {
	async get(token: string) {
		const [wishlist] = await db()
			.select({ id: wishlists.id, title: wishlists.title })
			.from(wishlists)
			.where(eq(wishlists.shareToken, token));
		if (!wishlist)
			throw new PublicError("This wishlist doesn't exist or isn't shared.");
		// Opening your own link while signed in must not spoil the surprise.
		const isOwner = await auth.hasSession();
		const items = await db()
			.select({ ...itemFields, claimHash: wishlistItems.claimHash })
			.from(wishlistItems)
			.where(eq(wishlistItems.wishlistId, wishlist.id))
			.orderBy(asc(wishlistItems.createdAt));
		return {
			title: wishlist.title,
			isOwner,
			items: items.map(({ claimHash, ...item }) => ({
				...item,
				claimed: !isOwner && claimHash !== null,
			})),
		};
	}

	// Returns a secret that lets this friend (and only them) unclaim later.
	// One atomic UPDATE: if two friends claim at once, exactly one wins.
	async claim(token: string, itemId: string) {
		// "Already claimed" would leak claims to the owner.
		if (await auth.hasSession())
			throw new PublicError("You can't claim items on your own list.");
		const secret = randomBytes(32).toString("base64url");
		const claimed = await db()
			.update(wishlistItems)
			.set({
				claimHash: createHash("sha256").update(secret).digest("base64url"),
			})
			.where(and(this.#item(token, itemId), isNull(wishlistItems.claimHash)))
			.returning({ id: wishlistItems.id });
		if (claimed.length !== 1)
			throw new PublicError("Someone already claimed this.");
		return secret;
	}

	async unclaim(token: string, itemId: string, secret: string) {
		const released = await db()
			.update(wishlistItems)
			.set({ claimHash: null })
			.where(
				and(
					this.#item(token, itemId),
					eq(
						wishlistItems.claimHash,
						createHash("sha256").update(secret).digest("base64url"),
					),
				),
			)
			.returning({ id: wishlistItems.id });
		if (released.length !== 1)
			throw new PublicError("Couldn't unclaim this item.");
	}

	// The item, but only if it belongs to the list this share token points at.
	#item(token: string, itemId: string) {
		return and(
			eq(wishlistItems.id, itemId),
			inArray(
				wishlistItems.wishlistId,
				db()
					.select({ id: wishlists.id })
					.from(wishlists)
					.where(eq(wishlists.shareToken, token)),
			),
		);
	}
}

export const ownWishlists = new WishlistRepository();
export const sharedWishlists = new SharedWishlistRepository();
