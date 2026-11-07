import { createMiddleware } from "@tanstack/react-start";

// Dev only: TanStack Devtools inject <style> tags without a nonce and talk to
// their event bus on a separate localhost port. Production stays strict.
const dev = (extra: string) => (import.meta.env.DEV ? extra : "");

const isMyspace = (pathname: string) =>
	pathname === "/myspace" || pathname.startsWith("/myspace/");

// Strict headers for every /myspace page. The per-request nonce is handed to the
// router (see router.tsx) so only scripts rendered by the app itself can run.
export const myspaceHeaders = createMiddleware().server(
	async ({ pathname, handlerType, next }) => {
		// Images set their own (stricter, cacheable) headers in images/$key.ts.
		const protect =
			handlerType === "router" &&
			isMyspace(pathname) &&
			!pathname.startsWith("/myspace/images/");
		const nonce = protect
			? btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
			: undefined;
		const result = await next({ context: { nonce } });
		if (!protect) return result;

		const response = new Response(result.response.body, result.response);
		const headers = {
			"Content-Security-Policy": [
				"default-src 'self'",
				`script-src 'self' 'nonce-${nonce}'`,
				`style-src 'self' https://fonts.googleapis.com${dev(" 'unsafe-inline'")}`,
				"font-src https://fonts.gstatic.com",
				"img-src 'self' data:",
				`connect-src 'self'${dev(" ws://localhost:* http://localhost:*")}`,
				"object-src 'none'",
				"base-uri 'none'",
				"form-action 'self'",
				"frame-ancestors 'none'",
			].join("; "),
			"Strict-Transport-Security": "max-age=63072000; includeSubDomains",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "no-referrer",
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cache-Control": "no-store",
			"X-Robots-Tag": "noindex, nofollow",
		};
		for (const [name, value] of Object.entries(headers))
			response.headers.set(name, value);
		return { ...result, response };
	},
);
