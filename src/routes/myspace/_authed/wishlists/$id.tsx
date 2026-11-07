import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	Copy,
	ExternalLink,
	Package,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/common/ui/alert";
import { Button, buttonClass } from "@/common/ui/button";
import { Card } from "@/common/ui/card";
import { createAppColumnHelper, DataTable } from "@/common/ui/data-table";
import { Dialog } from "@/common/ui/dialog";
import { control } from "@/common/ui/form/field";
import { useAppForm } from "@/common/ui/form/use-app-form";
import { PageHeader } from "@/common/ui/page-header";
import { eyebrow, heading } from "@/common/ui/text";
import { useAction } from "@/common/ui/use-action";
import { formatPrice, ItemImage } from "@/domains/wishlists/item";
import { ItemForm, type ItemValues } from "@/domains/wishlists/item-form";
import {
	addItem,
	deleteItem,
	deleteWishlist,
	getWishlist,
	renameWishlist,
	shareWishlist,
	unshareWishlist,
	updateItem,
} from "@/domains/wishlists/server";

export const Route = createFileRoute("/myspace/_authed/wishlists/$id")({
	loader: ({ params }) => getWishlist({ data: { id: params.id } }),
	component: WishlistPage,
});

type Item = Awaited<ReturnType<typeof getWishlist>>["items"][number];

const column = createAppColumnHelper<Item>();

// Add / edit dialog: undefined = closed, "new" = add, otherwise the item.
type Editing = undefined | "new" | Item;

function WishlistPage() {
	const list = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate();
	const [editing, setEditing] = useState<Editing>();
	const { busy, error, run } = useAction("Something went wrong.");

	// Run a change, then reload the page data.
	const mutate = (action: () => Promise<unknown>) =>
		run(async () => {
			await action();
			await router.invalidate();
		});

	const id = list.id;

	const saveItem = async (values: ItemValues) => {
		if (editing && editing !== "new")
			await updateItem({ data: { id: editing.id, ...values } });
		else await addItem({ data: { wishlistId: id, ...values } });
		await router.invalidate();
		setEditing(undefined);
	};

	const removeItem = (item: Item) => {
		if (confirm(`Delete "${item.name}"?`))
			mutate(() => deleteItem({ data: { id: item.id } }));
	};

	const removeList = () => {
		if (!confirm(`Delete "${list.title}" and all its items?`)) return;
		run(async () => {
			await deleteWishlist({ data: { id } });
			await navigate({ to: "/myspace/wishlists" });
		});
	};

	// Rebuilt only when `busy` flips: new columns would recompute every row model.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the handlers only call stable setters
	const columns = useMemo(
		() =>
			column.columns([
				column.accessor("name", {
					header: "Item",
					cell: ({ row: { original: item } }) => (
						<div className="flex items-center gap-3">
							<ItemImage imageKey={item.imageKey} size="size-12" />
							<div className="min-w-0">
								{item.url ? (
									<a
										href={item.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
									>
										{item.name}
										<ExternalLink
											aria-hidden="true"
											className="size-3.5 text-[#9a9a9a]"
										/>
									</a>
								) : (
									<span>{item.name}</span>
								)}
								{item.note && (
									<p className="mt-0.5 line-clamp-1 text-xs text-[#9a9a9a]">
										{item.note}
									</p>
								)}
							</div>
						</div>
					),
				}),
				column.accessor("priceCents", {
					header: "Price",
					sortUndefined: "last",
					meta: { align: "right" },
					cell: ({ getValue }) => {
						const cents = getValue();
						return cents === null ? (
							<span className="text-[#6b6b6b]">—</span>
						) : (
							<span className="tabular-nums">{formatPrice(cents)}</span>
						);
					},
				}),
				column.display({
					id: "actions",
					meta: { align: "right", className: "w-28" },
					header: () => <span className="sr-only">Actions</span>,
					cell: ({ row: { original: item } }) => (
						<div className="flex justify-end gap-1">
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Edit ${item.name}`}
								onClick={() => setEditing(item)}
							>
								<Pencil aria-hidden="true" className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Delete ${item.name}`}
								disabled={busy}
								onClick={() => removeItem(item)}
								className="hover:text-[#ff8a8a]"
							>
								<Trash2 aria-hidden="true" className="size-4" />
							</Button>
						</div>
					),
				}),
			]),
		[busy],
	);

	return (
		<div className="flex max-w-4xl flex-col gap-8">
			<PageHeader
				eyebrow={
					<Link
						to="/myspace/wishlists"
						className={`${eyebrow} inline-flex items-center gap-1.5 no-underline hover:text-[#f2f2f2]`}
					>
						<ArrowLeft aria-hidden="true" className="size-3.5" /> Wishlists
					</Link>
				}
				title={<RenameForm key={list.title} id={id} title={list.title} />}
				description={`${list.items.length} ${list.items.length === 1 ? "item" : "items"}`}
			/>

			<Alert>{error}</Alert>

			<DataTable
				label="Items"
				data={list.items}
				columns={columns}
				searchPlaceholder="Search items…"
				actions={
					<Button variant="primary" onClick={() => setEditing("new")}>
						<Plus aria-hidden="true" className="size-4" /> Add item
					</Button>
				}
				empty={
					<div className="flex flex-col items-center gap-4">
						<Package aria-hidden="true" className="size-8 opacity-40" />
						<p>No items yet. Paste a product link to get started.</p>
					</div>
				}
			/>

			<ShareCard
				shareToken={list.shareToken}
				busy={busy}
				run={run}
				onShare={() => mutate(() => shareWishlist({ data: { id } }))}
				onUnshare={() => mutate(() => unshareWishlist({ data: { id } }))}
			/>

			<Card
				title="Danger zone"
				tone="danger"
				description="Deletes the list, its items and images. A shared link stops working."
			>
				<Button variant="danger" disabled={busy} onClick={removeList}>
					<Trash2 aria-hidden="true" className="size-4" /> Delete wishlist
				</Button>
			</Card>

			<Dialog
				open={editing !== undefined}
				onClose={() => setEditing(undefined)}
				title={editing === "new" ? "Add item" : "Edit item"}
			>
				<ItemForm
					item={editing === "new" ? undefined : editing}
					submitLabel={editing === "new" ? "Add item" : "Save changes"}
					onSubmit={saveItem}
					onCancel={() => setEditing(undefined)}
				/>
			</Dialog>
		</div>
	);
}

// The title is the input: edit in place, Save appears once it changed.
function RenameForm({ id, title }: { id: string; title: string }) {
	const router = useRouter();
	const { error, run } = useAction("Couldn't rename the wishlist.");
	const form = useAppForm({
		defaultValues: { title },
		onSubmit: ({ value }) =>
			run(async () => {
				await renameWishlist({ data: { id, ...value } });
				await router.invalidate();
			}),
	});

	return (
		<form
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="flex flex-wrap items-center gap-2">
				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) => (!value.trim() ? "Required" : undefined),
					}}
				>
					{(field) => (
						<h1 className="min-w-0 flex-1">
							<input
								name={field.name}
								value={field.state.value}
								onChange={(event) => field.handleChange(event.target.value)}
								onBlur={field.handleBlur}
								maxLength={100}
								aria-label="Wishlist name"
								aria-invalid={field.state.meta.errors.length > 0 || undefined}
								className={`${heading} w-full border-b border-transparent bg-transparent hover:border-white/20 focus:border-[#f2f2f2] focus:outline-none aria-invalid:border-[#ff8a8a]`}
							/>
						</h1>
					)}
				</form.Field>
				<form.Subscribe selector={(state) => state.isDefaultValue}>
					{(unchanged) =>
						!unchanged && (
							<div className="flex gap-2">
								<Button variant="ghost" onClick={() => form.reset()}>
									Cancel
								</Button>
								<form.AppForm>
									<form.SubmitButton>Save</form.SubmitButton>
								</form.AppForm>
							</div>
						)
					}
				</form.Subscribe>
			</div>
			{error && (
				<div className="mt-3">
					<Alert>{error}</Alert>
				</div>
			)}
		</form>
	);
}

function ShareCard({
	shareToken,
	busy,
	run,
	onShare,
	onUnshare,
}: {
	shareToken: string | null;
	busy: boolean;
	run: (action: () => Promise<unknown>) => Promise<void>;
	onShare: () => void;
	onUnshare: () => void;
}) {
	const [copied, setCopied] = useState(false);
	// location only exists in the browser; the link fills in after hydration.
	const [origin, setOrigin] = useState("");
	useEffect(() => setOrigin(location.origin), []);

	const sharePath = shareToken && `/myspace/share/${shareToken}`;

	if (!sharePath)
		return (
			<Card
				title="Share with friends"
				description="Create a link. Anyone with it can see this list and claim items; you won't see what's claimed."
			>
				<Button disabled={busy} onClick={onShare}>
					Create share link
				</Button>
			</Card>
		);

	const copy = () =>
		run(async () => {
			await navigator.clipboard.writeText(origin + sharePath);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});

	return (
		<Card
			title="Share with friends"
			description="Anyone with this link can see the list and claim items. You won't see what's claimed."
		>
			<div className="flex gap-2">
				<input
					readOnly
					value={origin + sharePath}
					aria-label="Share link"
					onFocus={(event) => event.currentTarget.select()}
					className={`${control} min-h-11 font-mono text-xs text-[#9a9a9a]`}
				/>
				<Button variant="primary" onClick={copy} disabled={!origin}>
					{copied ? (
						<Check aria-hidden="true" className="size-4" />
					) : (
						<Copy aria-hidden="true" className="size-4" />
					)}
					{copied ? "Copied" : "Copy"}
				</Button>
			</div>
			<div className="mt-4 flex flex-wrap gap-2">
				<a
					href={sharePath}
					target="_blank"
					rel="noopener"
					className={buttonClass("ghost", "sm")}
				>
					<ExternalLink aria-hidden="true" className="size-3.5" /> Open
				</a>
				<Button
					variant="ghost"
					size="sm"
					disabled={busy}
					onClick={() => {
						if (confirm("Replace the link? The old one stops working."))
							onShare();
					}}
				>
					New link
				</Button>
				<Button variant="ghost" size="sm" disabled={busy} onClick={onUnshare}>
					Stop sharing
				</Button>
			</div>
		</Card>
	);
}
