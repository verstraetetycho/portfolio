import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { images } from "@/domains/wishlists/images";

const notFound = () => new Response("Not found", { status: 404 });

// Serves wishlist images from our own origin, so the CSP can stay at
// img-src 'self'. Keys are random UUIDs: knowing one is the only way in,
// which suits product photos shown to friends without an account.
export const Route = createFileRoute("/myspace/images/$key")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const key = z.guid().safeParse(params.key);
				if (!key.success) return notFound();
				const file = await images.get(key.data);
				if (!file) return notFound();
				return new Response(file.body, {
					headers: {
						// Set by putImage from the sniffed bytes, never by the client.
						"Content-Type": file.contentType ?? "application/octet-stream",
						// Keys are never reused.
						"Cache-Control": "public, max-age=31536000, immutable",
						"X-Content-Type-Options": "nosniff",
						"Content-Security-Policy": "default-src 'none'; sandbox",
						"Cross-Origin-Resource-Policy": "same-origin",
					},
				});
			},
		},
	},
});
