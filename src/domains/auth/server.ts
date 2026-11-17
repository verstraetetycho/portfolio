import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/global/auth";
import { serverFn } from "@/global/server-fn";

// For route guards; server functions check the session themselves (authed).
export const sessionStatus = createServerFn({ method: "GET" })
	.middleware([serverFn])
	.handler(() => auth.hasSession());
