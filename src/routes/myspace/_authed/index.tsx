import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { PageHeader } from "@/common/ui/page-header";
import { eyebrow } from "@/common/ui/text";
import { listWishlists } from "@/domains/wishlists/server";

export const Route = createFileRoute("/myspace/_authed/")({
	loader: () => listWishlists(),
	component: Overview,
});

function Overview() {
	const lists = Route.useLoaderData();
	const items = lists.reduce((sum, list) => sum + list.itemCount, 0);

	return (
		<>
			<PageHeader title="Overview" />
			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Link
					to="/myspace/wishlists"
					className="border border-white/30 p-6 no-underline hover:border-[#f2f2f2]"
				>
					<span className={`flex items-center gap-2 ${eyebrow}`}>
						<Gift aria-hidden="true" className="size-4" /> Wishlists
					</span>
					<p className="mt-4 font-display text-3xl font-light">
						{lists.length}
					</p>
					<p className="text-sm text-[#9a9a9a]">
						{lists.length === 1 ? "list" : "lists"} · {items}{" "}
						{items === 1 ? "item" : "items"}
					</p>
				</Link>
			</div>
		</>
	);
}
