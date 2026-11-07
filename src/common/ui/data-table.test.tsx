// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { createAppColumnHelper, DataTable } from "./data-table";

type Row = { id: string; name: string; price: number };
const column = createAppColumnHelper<Row>();
const columns = column.columns([
	column.accessor("name", { header: "Name" }),
	column.accessor("price", { header: "Price" }),
]);
const data: Row[] = [
	{ id: "1", name: "Lamp", price: 30 },
	{ id: "2", name: "Book", price: 10 },
	{ id: "3", name: "Chair", price: 20 },
];

afterEach(cleanup);

const names = () =>
	screen
		.getAllByRole("row")
		.slice(1) // header
		.map((row) => row.querySelector("td")?.textContent);

test("searches and sorts", () => {
	render(
		<DataTable label="Things" data={data} columns={columns} empty="none" />,
	);
	expect(names()).toEqual(["Lamp", "Book", "Chair"]);

	fireEvent.click(screen.getByRole("button", { name: /price/i }));
	expect(names()).toEqual(["Book", "Chair", "Lamp"]);
	expect(screen.getByRole("columnheader", { name: /price/i })).toHaveProperty(
		"ariaSort",
		"ascending",
	);

	fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ch" } });
	expect(names()).toEqual(["Chair"]);
	expect(screen.getByText("1 of 3")).toBeTruthy();

	fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
	expect(screen.getByText(/Nothing matches/)).toBeTruthy();
});

test("shows the empty state without data", () => {
	render(
		<DataTable
			label="Things"
			data={[]}
			columns={columns}
			empty="No things yet."
		/>,
	);
	expect(screen.getByText("No things yet.")).toBeTruthy();
	expect(screen.queryByRole("table")).toBeNull();
});
