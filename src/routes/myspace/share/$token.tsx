import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert } from "@/common/ui/alert";
import { Brand } from "@/common/ui/brand";
import { Button } from "@/common/ui/button";
import { Panel } from "@/common/ui/panel";
import { heading } from "@/common/ui/text";
import { useAction } from "@/common/ui/use-action";
import { ItemDetails } from "@/domains/wishlists/item";
import {
	claimItem,
	getSharedWishlist,
	unclaimItem,
} from "@/domains/wishlists/server";

// Public page for friends. Lives under /myspace so it gets the same strict
// headers (CSP, noindex, no-store) without extra setup.
export const Route = createFileRoute("/myspace/share/$token")({
	loader: ({ params }) => getSharedWishlist({ data: { token: params.token } }),
	head: ({ loaderData }) => ({
		meta: [
			{ title: loaderData ? `${loaderData.title} · wishlist` : "wishlist" },
		],
	}),
	component: SharedWishlist,
	errorComponent: ({ error }) => (
		<Panel
			title="Wishlist"
			error={error instanceof Error ? error.message : undefined}
		>
			{null}
		</Panel>
	),
});

// Unclaim secrets for items this browser claimed, by item id. No accounts,
// so clearing browser storage means this friend can no longer unclaim.
const STORAGE_KEY = "wishlist-claims";

function useMyClaims() {
	const [claims, setClaims] = useState<Record<string, string>>({});
	useEffect(() => {
		try {
			setClaims(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
		} catch {}
	}, []);
	const save = (next: Record<string, string>) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		setClaims(next);
	};
	return [claims, save] as const;
}

function SharedWishlist() {
	const list = Route.useLoaderData();
	const { token } = Route.useParams();
	const router = useRouter();
	const [myClaims, saveMyClaims] = useMyClaims();
	const { busy, error, run } = useAction(
		"That didn't work. Someone may have just claimed it.",
	);

	// Always reload afterwards, so a lost race shows the item as claimed.
	const act = (action: () => Promise<void>) =>
		run(async () => {
			try {
				await action();
			} finally {
				await router.invalidate();
			}
		});

	const claim = (itemId: string) =>
		act(async () => {
			const secret = await claimItem({ data: { token, itemId } });
			saveMyClaims({ ...myClaims, [itemId]: secret });
		});

	const unclaim = (itemId: string, secret: string) =>
		act(async () => {
			await unclaimItem({ data: { token, itemId, secret } });
			const { [itemId]: _, ...rest } = myClaims;
			saveMyClaims(rest);
		});

	return (
		<>
			<div
				aria-hidden="true"
				className="dotgrid pointer-events-none fixed inset-0 -z-10"
			/>
			<main className="mx-auto max-w-2xl p-6 md:py-16">
				<Brand label="~/wishlist" />
				<h1 className={`mt-3 ${heading}`}>{list.title}</h1>
				<p className="mt-2 text-sm text-[#9a9a9a]">
					{list.isOwner
						? "This is your list. Claims are hidden from you."
						: "Claim what you'll buy, so nobody buys the same thing. Tycho won't see what's claimed."}
				</p>
				{error && (
					<div className="mt-4">
						<Alert>{error}</Alert>
					</div>
				)}

				<ul className="mt-8 divide-y divide-white/15 border-y border-white/15 bg-[#0a0a0a]">
					{list.items.map((item) => {
						const secret = myClaims[item.id];
						return (
							<li
								key={item.id}
								className={`flex items-start gap-4 py-4 ${item.claimed && !secret ? "opacity-50" : ""}`}
							>
								<ItemDetails item={item} />
								{list.isOwner ? null : secret && item.claimed ? (
									<Button
										size="sm"
										disabled={busy}
										onClick={() => unclaim(item.id, secret)}
									>
										Unclaim
									</Button>
								) : item.claimed ? (
									<span className="inline-flex min-h-11 items-center px-4 text-xs uppercase tracking-[0.12em] text-[#9a9a9a]">
										Claimed
									</span>
								) : (
									<Button
										size="sm"
										disabled={busy}
										onClick={() => claim(item.id)}
									>
										Claim
									</Button>
								)}
							</li>
						);
					})}
					{list.items.length === 0 && (
						<li className="py-4 text-sm text-[#9a9a9a]">Nothing here yet.</li>
					)}
				</ul>
			</main>
		</>
	);
}
