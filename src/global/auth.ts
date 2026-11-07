import { env } from "cloudflare:workers";
import { createHash } from "node:crypto";
import { passkey } from "@better-auth/passkey";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./schema";

// The single owner every invite registers a passkey for.
// ponytail: one fixed user. For more users, let an invite carry the user
// (name/email) and scope wishlists by userId.
const OWNER = { id: "owner", name: "myspace", email: "owner@myspace.invalid" };

const inviteInvalid = () =>
	new APIError("BAD_REQUEST", { message: "Invite invalid or expired" });

// Registration needs an invite from `npm run myspace:invite` (see create-invite.ts).
class InviteStore {
	async isValid(token: string | null | undefined) {
		if (!token) return false;
		const rows = await db()
			.select({ tokenHash: schema.invites.tokenHash })
			.from(schema.invites)
			.where(this.#where(token));
		return rows.length === 1;
	}

	// Single use: deleted by the same query that validates it.
	async consume(token: string | null | undefined) {
		if (!token) return false;
		const deleted = await db()
			.delete(schema.invites)
			.where(this.#where(token))
			.returning({ tokenHash: schema.invites.tokenHash });
		return deleted.length === 1;
	}

	#where(token: string) {
		return and(
			eq(
				schema.invites.tokenHash,
				createHash("sha256").update(token).digest("base64url"),
			),
			gt(schema.invites.expiresAt, new Date()),
		);
	}
}

// Better Auth with passkeys only. Built lazily: env is read per request.
class Auth {
	readonly invites = new InviteStore();
	#instance?: ReturnType<Auth["create"]>;

	get instance() {
		this.#instance ??= this.create();
		return this.#instance;
	}

	// Served at /myspace/api/auth/*. Every call except the session check counts
	// against the per-IP limit (the passkey option endpoints are GETs).
	async handler(request: Request) {
		if (!new URL(request.url).pathname.endsWith("/get-session")) {
			const key = request.headers.get("cf-connecting-ip") ?? "local";
			const { success } = await env.MYSPACE_RATE_LIMITER.limit({ key });
			if (!success)
				return Response.json(
					{ message: "Too many attempts, wait a minute." },
					{ status: 429 },
				);
		}
		return this.instance.handler(request);
	}

	async hasSession() {
		const session = await this.instance.api.getSession({
			headers: getRequestHeaders(),
		});
		return session !== null;
	}

	private create() {
		return betterAuth({
			appName: "myspace",
			baseURL: env.MYSPACE_ORIGIN,
			basePath: "/myspace/api/auth",
			secret: env.BETTER_AUTH_SECRET,
			database: drizzleAdapter(db(), { provider: "pg", schema }),
			session: { expiresIn: 8 * 60 * 60, disableSessionRefresh: true },
			advanced: {
				cookiePrefix: "myspace",
				defaultCookieAttributes: { sameSite: "strict" },
			},
			plugins: [
				passkey({
					rpName: "myspace",
					rpID: new URL(env.MYSPACE_ORIGIN).hostname,
					origin: env.MYSPACE_ORIGIN,
					authenticatorSelection: {
						residentKey: "required",
						userVerification: "required",
					},
					registration: {
						// Signed out: the invite (passed as `context`) is the credential.
						requireSession: false,
						resolveUser: async ({ context }) => {
							if (!(await this.invites.isValid(context))) throw inviteInvalid();
							await db()
								.insert(schema.user)
								.values(OWNER)
								.onConflictDoNothing();
							return { id: OWNER.id, name: OWNER.name };
						},
						// Exactly one passkey: the new one replaces any old one and every
						// existing session is signed out. Runs before the passkey is stored.
						afterVerification: async ({ context, user }) => {
							if (!(await this.invites.consume(context))) throw inviteInvalid();
							await db()
								.delete(schema.passkey)
								.where(eq(schema.passkey.userId, user.id));
							await db()
								.delete(schema.session)
								.where(eq(schema.session.userId, user.id));
						},
					},
				}),
			],
		});
	}
}

export const auth = new Auth();
