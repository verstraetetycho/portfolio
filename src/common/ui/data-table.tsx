import {
	type CellData,
	type ColumnDef,
	columnFilteringFeature,
	createFilteredRowModel,
	createSortedRowModel,
	createTableHook,
	filterFn_includesString,
	globalFilteringFeature,
	type RowData,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	sortFn_text,
	type TableFeatures,
	tableFeatures,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import type { ReactNode } from "react";

declare module "@tanstack/react-table" {
	interface ColumnMeta<
		in out TFeatures extends TableFeatures,
		in out TData extends RowData,
		TValue extends CellData = CellData,
	> {
		align?: "right";
		// Extra classes for the column's <th> and <td>, e.g. "hidden sm:table-cell".
		className?: string;
	}
}

// Every dashboard table: client-side sorting and a search box. Rows need an id.
const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		text: sortFn_text,
		basic: sortFn_basic,
	},
	columnFilteringFeature,
	globalFilteringFeature,
	filteredRowModel: createFilteredRowModel(),
	filterFns: { includesString: filterFn_includesString },
});

export const { createAppColumnHelper, useAppTable } = createTableHook({
	features,
	getRowId: (row: { id: string }) => row.id,
	globalFilterFn: "includesString",
	// TanStack sorts numbers descending first; ascending is what people expect.
	sortDescFirst: false,
});

// Makes a whole row clickable: put this class on the row's main link.
export const rowLink =
	"no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

const alignClass = (align?: "right") =>
	align === "right" ? "text-right" : "text-left";

export function DataTable<TData extends { id: string }>({
	label,
	data,
	columns,
	searchPlaceholder = "Search…",
	actions,
	empty,
}: {
	// Accessible name for the table, e.g. "Wishlists".
	label: string;
	data: TData[];
	// biome-ignore lint/suspicious/noExplicitAny: columns mix value types
	columns: ColumnDef<typeof features, TData, any>[];
	searchPlaceholder?: string;
	// Buttons shown next to the search box, e.g. "New wishlist".
	actions?: ReactNode;
	// Shown instead of the table when there's no data at all.
	empty: ReactNode;
}) {
	const table = useAppTable({ data, columns });
	const rows = table.getRowModel().rows;
	const query = table.state.globalFilter ?? "";

	return (
		<div className="border border-white/10 bg-white/[0.02]">
			<div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-3">
				<label className="relative flex min-w-48 flex-1 items-center">
					<span className="sr-only">Search {label.toLowerCase()}</span>
					<Search
						aria-hidden="true"
						className="pointer-events-none absolute left-3 size-4 text-[#9a9a9a]"
					/>
					<input
						type="search"
						value={query}
						onChange={(event) => table.setGlobalFilter(event.target.value)}
						placeholder={searchPlaceholder}
						disabled={data.length === 0}
						className="min-h-10 w-full border border-transparent bg-transparent pr-3 pl-9 text-sm placeholder:text-[#6b6b6b] hover:border-white/10 focus:border-white/30 focus:bg-white/[0.03] focus:outline-none disabled:opacity-40"
					/>
				</label>
				<span className="text-xs text-[#9a9a9a] tabular-nums">
					{query ? `${rows.length} of ${data.length}` : data.length}
				</span>
				{actions && <div className="flex gap-2">{actions}</div>}
			</div>

			{data.length === 0 ? (
				<div className="px-6 py-14 text-center text-sm text-[#9a9a9a]">
					{empty}
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<caption className="sr-only">{label}</caption>
						<thead>
							{table.getHeaderGroups().map((group) => (
								<tr key={group.id} className="border-b border-white/10">
									{group.headers.map((header) => {
										const { align, className = "" } =
											header.column.columnDef.meta ?? {};
										const sorted = header.column.getIsSorted();
										const SortIcon =
											sorted === "asc"
												? ArrowUp
												: sorted === "desc"
													? ArrowDown
													: ChevronsUpDown;
										return (
											<th
												key={header.id}
												scope="col"
												aria-sort={
													sorted === "asc"
														? "ascending"
														: sorted === "desc"
															? "descending"
															: undefined
												}
												className={`h-10 px-4 text-xs font-normal uppercase tracking-[0.12em] text-[#9a9a9a] ${alignClass(align)} ${className}`}
											>
												{header.isPlaceholder ? null : header.column.getCanSort() ? (
													<button
														type="button"
														onClick={header.column.getToggleSortingHandler()}
														className={`group inline-flex items-center gap-1.5 uppercase hover:text-[#f2f2f2] ${align === "right" ? "flex-row-reverse" : ""}`}
													>
														<table.FlexRender header={header} />
														<SortIcon
															aria-hidden="true"
															className={`size-3.5 ${sorted ? "text-[#f2f2f2]" : "opacity-40 group-hover:opacity-100"}`}
														/>
													</button>
												) : (
													<table.FlexRender header={header} />
												)}
											</th>
										);
									})}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-white/[0.06]">
							{rows.map((row) => (
								<tr
									key={row.id}
									className="relative transition-colors hover:bg-white/[0.03] has-[a:focus-visible]:bg-white/[0.05] has-[a:focus-visible]:outline has-[a:focus-visible]:outline-1 has-[a:focus-visible]:-outline-offset-1 has-[a:focus-visible]:outline-white/40"
								>
									{row.getAllCells().map((cell) => {
										const { align, className = "" } =
											cell.column.columnDef.meta ?? {};
										return (
											<td
												key={cell.id}
												className={`px-4 py-3 align-middle ${alignClass(align)} ${className}`}
											>
												<table.FlexRender cell={cell} />
											</td>
										);
									})}
								</tr>
							))}
							{rows.length === 0 && (
								<tr>
									<td
										colSpan={table.getAllLeafColumns().length}
										className="px-4 py-10 text-center text-[#9a9a9a]"
									>
										Nothing matches “{query}”.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
