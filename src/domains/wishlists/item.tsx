import { ExternalLink } from "lucide-react";

const euro = new Intl.NumberFormat("nl-BE", {
	style: "currency",
	currency: "EUR",
});

export const formatPrice = (cents: number) => euro.format(cents / 100);

type Item = {
	name: string;
	url: string | null;
	priceCents: number | null;
	note: string | null;
	imageKey: string | null;
};

export const imageSrc = (key: string) => `/myspace/images/${key}`;

export function ItemImage({
	imageKey,
	size = "size-16",
}: {
	imageKey: string | null;
	size?: string;
}) {
	return imageKey ? (
		<img
			src={imageSrc(imageKey)}
			alt=""
			loading="lazy"
			className={`${size} shrink-0 border border-white/15 bg-white object-contain`}
		/>
	) : (
		<div
			aria-hidden="true"
			className={`${size} shrink-0 border border-dashed border-white/15 bg-white/2`}
		/>
	);
}

// Shared by the owner page and the friends' page.
export function ItemDetails({ item }: { item: Item }) {
	return (
		<div className="flex min-w-0 flex-1 gap-4">
			<ItemImage imageKey={item.imageKey} />
			<div className="min-w-0 flex-1">
				{/* One line; the full name shows on hover. */}
				<div className="flex min-w-0" title={item.name}>
					{item.url ? (
						<a
							href={item.url}
							target="_blank"
							rel="noreferrer"
							className="flex min-w-0 items-center gap-1.5 underline-offset-4 hover:underline"
						>
							<span className="truncate">{item.name}</span>
							<ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
						</a>
					) : (
						<span className="truncate">{item.name}</span>
					)}
				</div>
				{item.priceCents !== null && (
					<p className="mt-1 text-sm tabular-nums text-[#9a9a9a]">
						{formatPrice(item.priceCents)}
					</p>
				)}
				{item.note && (
					<p className="mt-1 text-sm text-[#9a9a9a]">{item.note}</p>
				)}
			</div>
		</div>
	);
}
