import { defineConfig } from "drizzle-kit";

process.loadEnvFile(); // .env (Node built-in), same file the dev server uses

export default defineConfig({
	dialect: "postgresql",
	schema: ["./src/global/schema.ts", "./src/domains/*/schema.ts"],
	out: "./drizzle",
	// Migrations need a direct (non-pooled) connection.
	dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
	strict: true,
});
