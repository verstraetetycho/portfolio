import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

// Browser side of Better Auth; talks to /myspace/api/auth/* on this origin.
export const authClient = createAuthClient({
	basePath: "/myspace/api/auth",
	plugins: [passkeyClient()],
});
