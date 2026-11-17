// CLI: npm run myspace:invite [-- <origin>]
// Creates a single-use passkey registration link, valid for 10 minutes.
// Only someone with the database credentials (your local .env) can run this.
// Registering with the link replaces any existing passkey and signs out all sessions.
import { createHash, randomBytes } from "node:crypto";
// Plain SQL (not ./schema.ts): this runs under plain Node, which can't resolve the @/ imports.
import { neon } from "@neondatabase/serverless";

process.loadEnvFile();
const { DATABASE_URL, MYSPACE_ORIGIN } = process.env;
const origin = process.argv[2] ?? MYSPACE_ORIGIN;
if (!DATABASE_URL || !origin)
	throw new Error("Set DATABASE_URL and MYSPACE_ORIGIN in .env");

const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("base64url");
await neon(DATABASE_URL)`
	insert into invites (token_hash, expires_at)
	values (${tokenHash}, now() + interval '10 minutes')`;

// The token sits in the #fragment, which browsers never send to the server.
console.log(
	`Valid for 10 minutes, single use:\n${new URL(origin).origin}/myspace/login#invite=${token}`,
);
