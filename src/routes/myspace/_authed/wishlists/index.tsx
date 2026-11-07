import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Gift, Link2, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/common/ui/alert";
import { Button } from "@/common/ui/button";
import {
	createAppColumnHelper,
	DataTable,
	rowLink,
} from "@/common/ui/data-table";
import { Dialog } from "@/common/ui/dialog";
import { useAppForm } from "@/common/ui/form/use-app-form";
import { PageHeader } from "@/common/ui/page-header";
import { useAction } from "@/common/ui/use-action";
import { createWishlist, listWishlists } from "@/domains/wishlists/server";

export const Route = createFileRoute("/myspace/_authed/wishlists/")({
	loader: () => listWishlists(),
	component: Wishlists,
});

type Wishlist = Awaited<ReturnType<typeof listWishlists>>[number];

const column = createAppColumnHelper<Wishlist>();
const columns = column.columns([
	column.accessor("title", {
		header: "Name",
		cell: ({ row }) => (
			<Link
				to="/myspace/wishlists/$id"
				params={{ id: row.original.id }}
				className={`${rowLink} font-display text-base`}
			>
				{row.original.title}
			</Link>
		),
	}),
	column.accessor("itemCount", {
		header: "Items",
		meta: { align: "right" },
		cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
	}),
	column.accessor((list) => (list.shareToken ? "Shared" : "Private"), {
		id: "sharing",
		header: "Sharing",
		meta: { className: "hidden sm:table-cell" },
		cell: ({ getValue }) =>
			getValue() === "Shared" ? (
				<span className="inline-flex items-center gap-1.5 border border-white/20 px-2 py-0.5 text-xs">
					<Link2 aria-hidden="true" className="size-3" /> Shared
				</span>
			) : (
				<span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-[#9a9a9a]">
					<Lock aria-hidden="true" className="size-3" /> Private
				</span>
			),
	}),
	column.display({
		id: "open",
		meta: { align: "right", className: "w-10" },
		cell: () => (
			<ChevronRight
				aria-hidden="true"
				className="ml-auto size-4 text-[#9a9a9a]"
			/>
		),
	}),
]);

function Wishlists() {
	const lists = Route.useLoaderData();
	const [creating, setCreating] = useState(false);
	const open = () => setCreating(true);

	return (
		<div className="max-w-4xl">
			<PageHeader
				title="Wishlists"
				description="Lists you can share with friends. They claim gifts; you never see which."
				actions={
					<Button variant="primary" onClick={open}>
						<Plus aria-hidden="true" className="size-4" /> New wishlist
					</Button>
				}
			/>
			<div className="mt-8">
				<DataTable
					label="Wishlists"
					data={lists}
					columns={columns}
					searchPlaceholder="Search wishlists…"
					empty={
						<div className="flex flex-col items-center gap-4">
							<Gift aria-hidden="true" className="size-8 opacity-40" />
							<p>No wishlists yet.</p>
							<Button onClick={open}>Create your first</Button>
						</div>
					}
				/>
			</div>
			<Dialog
				open={creating}
				onClose={() => setCreating(false)}
				title="New wishlist"
				description="Add items once it's created."
			>
				<CreateWishlistForm onCancel={() => setCreating(false)} />
			</Dialog>
		</div>
	);
}

function CreateWishlistForm({ onCancel }: { onCancel: () => void }) {
	const navigate = useNavigate();
	const { error, run } = useAction("Couldn't create the wishlist.");
	const form = useAppForm({
		defaultValues: { title: "" },
		onSubmit: ({ value }) =>
			run(async () => {
				const id = await createWishlist({ data: value });
				await navigate({ to: "/myspace/wishlists/$id", params: { id } });
			}),
	});

	return (
		<form
			noValidate
			className="flex flex-col gap-5"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.AppField
				name="title"
				validators={{
					onChange: ({ value }) =>
						!value.trim() ? "Give your list a name." : undefined,
				}}
			>
				{(field) => (
					<field.TextField
						label="Name"
						maxLength={100}
						placeholder="e.g. Birthday"
						autoFocus
					/>
				)}
			</form.AppField>
			<Alert>{error}</Alert>
			<div className="flex justify-end gap-2 border-t border-white/10 pt-5">
				<Button variant="ghost" onClick={onCancel}>
					Cancel
				</Button>
				<form.AppForm>
					<form.SubmitButton>Create</form.SubmitButton>
				</form.AppForm>
			</div>
		</form>
	);
}
