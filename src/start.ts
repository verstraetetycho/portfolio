import {
	createCsrfMiddleware,
	createMiddleware,
	createStart,
} from "@tanstack/react-start";
import { myspaceHeaders } from "@/global/security-headers";

// A custom start instance replaces TanStack's default CSRF check, so it's added back here.
const csrf = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

// www.tychoverstraete.be → tychoverstraete.be: passkeys are bound to a single domain.
const canonicalHost = createMiddleware().server(({ request, next }) => {
	const url = new URL(request.url);
	if (!url.hostname.startsWith("www.")) return next();
	url.hostname = url.hostname.slice(4);
	return Response.redirect(url, 301);
});

export const startInstance = createStart(() => ({
	requestMiddleware: [canonicalHost, csrf, myspaceHeaders],
}));
