import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/global/auth";

// Better Auth's endpoints (passkey sign-in/registration, session, sign-out).
export const Route = createFileRoute("/myspace/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => auth.handler(request),
			POST: ({ request }) => auth.handler(request),
		},
	},
});
