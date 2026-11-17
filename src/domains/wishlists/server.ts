import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authed, PublicError, rateLimited, serverFn } from "@/global/server-fn";
import { images } from "./images";
import { ownWishlists, sharedWishlists } from "./repository";

// Server functions only: input validation + middleware. Logic lives in repository.ts.
// Invalid input becomes a generic error via serverFn.

// Only http(s): links get rendered as <a href>, so a javascript: URL would be
// stored XSS.
const httpUrl = z.url({ protocol: /^https?$/, normalize: true }).max(2000);

// The item form posts strings; "" means "not filled in". Shared by add/update.
const itemFields = z
	.object({
		name: z.string().trim().min(1).max(200),
		url: httpUrl.or(z.literal("")).transform((url) => url || null),
		// Euros as typed → whole cents.
		price: z
			.string()
			.trim()
			.transform((euros) => (euros ? Math.round(Number(euros) * 100) : null))
			.pipe(z.int().nonnegative().nullable()),
		note: z
			.string()
			.trim()
			.max(1000)
			.transform((note) => note || null),
		imageKey: z
			.guid()
			.or(z.literal(""))
			.transform((key) => key || null),
	})
	.transform(({ price, ...item }) => ({ ...item, priceCents: price }));

// ---- Owner -----------------------------------------------------------------

export const listWishlists = createServerFn({ method: "GET" })
	.middleware([authed])
	.handler(() => ownWishlists.list());

export const getWishlist = createServerFn({ method: "GET" })
	.middleware([authed])
	.validator(z.object({ id: z.guid() }))
	.handler(({ data }) => ownWishlists.get(data.id));

export const createWishlist = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ title: z.string().trim().min(1).max(100) }))
	.handler(({ data }) => ownWishlists.create(data));

export const renameWishlist = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(
		z.object({ id: z.guid(), title: z.string().trim().min(1).max(100) }),
	)
	.handler(({ data }) => ownWishlists.rename(data.id, data.title));

export const deleteWishlist = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ id: z.guid() }))
	.handler(({ data }) => ownWishlists.delete(data.id));

export const shareWishlist = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ id: z.guid() }))
	.handler(({ data }) => ownWishlists.share(data.id));

export const unshareWishlist = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ id: z.guid() }))
	.handler(({ data }) => ownWishlists.unshare(data.id));

export const addItem = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.intersection(z.object({ wishlistId: z.guid() }), itemFields))
	.handler(({ data: { wishlistId, ...item } }) =>
		ownWishlists.addItem(wishlistId, item),
	);

export const updateItem = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.intersection(z.object({ id: z.guid() }), itemFields))
	.handler(({ data: { id, ...item } }) => ownWishlists.updateItem(id, item));

export const deleteItem = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ id: z.guid() }))
	.handler(({ data }) => ownWishlists.deleteItem(data.id));

// Images are stored before the item is saved, so the form can preview them.
// ponytail: an image uploaded or fetched for a form you then cancel stays in
// the bucket unreferenced. Add a cleanup of unreferenced keys if it piles up.
export const uploadImage = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator((data: unknown) => {
		const file = data instanceof FormData ? data.get("image") : null;
		if (!(file instanceof File)) throw new PublicError("No image");
		return file;
	})
	.handler(({ data }) => images.putResponse(new Response(data.stream())));

export const fetchProduct = createServerFn({ method: "POST" })
	.middleware([authed])
	.validator(z.object({ url: httpUrl }))
	.handler(({ data }) => ownWishlists.fetchProduct(data.url));

// ---- Friends (anyone with the share link) ----------------------------------

// Random tokens and secrets: 32 random bytes as base64url (see repository.ts).
const shareToken = z.string().regex(/^[\w-]{20,100}$/);

export const getSharedWishlist = createServerFn({ method: "GET" })
	.middleware([serverFn])
	.validator(z.object({ token: shareToken }))
	.handler(({ data }) => sharedWishlists.get(data.token));

export const claimItem = createServerFn({ method: "POST" })
	.middleware([rateLimited])
	.validator(z.object({ token: shareToken, itemId: z.guid() }))
	.handler(({ data }) => sharedWishlists.claim(data.token, data.itemId));

export const unclaimItem = createServerFn({ method: "POST" })
	.middleware([rateLimited])
	.validator(
		z.object({ token: shareToken, itemId: z.guid(), secret: shareToken }),
	)
	.handler(({ data }) =>
		sharedWishlists.unclaim(data.token, data.itemId, data.secret),
	);
