import { env } from "cloudflare:workers";
import { createMiddleware } from "@tanstack/react-start";
import {
	getRequestHeader,
	setResponseHeader,
} from "@tanstack/react-start/server";
// Only used inside .server() bodies, which are stripped from the client bundle.
import { auth } from "./auth";

// Errors whose message is safe to show the client. Anything else is logged
// server-side and replaced with a generic message, so internals never leak.
export class PublicError extends Error {}

// Base for every server function: never cached, never indexed, no leaked errors.
export const serverFn = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		setResponseHeader("Cache-Control", "no-store");
		setResponseHeader("X-Robots-Tag", "noindex, nofollow");
		try {
			return await next();
		} catch (error) {
			if (error instanceof PublicError) throw error;
			console.error(error);
			throw new Error("Something went wrong");
		}
	},
);

// Sign-in and registration: limited attempts per IP.
export const rateLimited = createMiddleware({ type: "function" })
	.middleware([serverFn])
	.server(async ({ next }) => {
		const key = getRequestHeader("cf-connecting-ip") ?? "local";
		const { success } = await env.MYSPACE_RATE_LIMITER.limit({ key });
		if (!success) throw new PublicError("Too many attempts, wait a minute.");
		return next();
	});

// Anything that touches private data. The route guard is only UX; this is the real check.
export const authed = createMiddleware({ type: "function" })
	.middleware([serverFn])
	.server(async ({ next }) => {
		if (!(await auth.hasSession())) throw new PublicError("Unauthorized");
		return next();
	});
