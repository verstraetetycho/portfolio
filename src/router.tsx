import { createRouter } from "@tanstack/react-router";
import { getGlobalStartContext } from "@tanstack/react-start";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		// CSP nonce set by the myspace headers middleware (server only, /myspace only).
		ssr: {
			nonce: (getGlobalStartContext() as { nonce?: string } | undefined)?.nonce,
		},
	});

	return router;
};
