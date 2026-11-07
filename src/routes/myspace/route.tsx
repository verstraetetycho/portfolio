import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/myspace")({
	head: () => ({
		meta: [
			{ title: "myspace" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
