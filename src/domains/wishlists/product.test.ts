import { expect, test, vi } from "vitest";
import { imageType } from "./images";

// images.ts reaches the Workers env through Bucket; not needed for imageType.
vi.mock("cloudflare:workers", () => ({ env: {} }));

import { type PageData, ProductPage } from "./product";

const pick = (data: PageData, url: string) =>
	new ProductPage(data, url).toJSON();

const page = (p: Partial<PageData>) => ({
	meta: {},
	jsonLd: [],
	title: "",
	...p,
});

test("JSON-LD Product wins, nested in @graph, EUR price", () => {
	const ld = JSON.stringify({
		"@graph": [
			{ "@type": "WebPage" },
			{
				"@type": ["Product"],
				name: "Lamp &amp; shade",
				image: [{ url: "/img/lamp.jpg" }],
				offers: { price: "49.95", priceCurrency: "EUR" },
			},
		],
	});
	expect(
		pick(
			page({ jsonLd: ["not json", ld], meta: { "og:title": "Other" } }),
			"https://shop.example/p/1",
		),
	).toEqual({
		name: "Lamp & shade",
		priceCents: 4995,
		imageUrl: "https://shop.example/img/lamp.jpg",
	});
});

test("falls back to Open Graph meta and <title>", () => {
	expect(
		pick(
			page({
				meta: {
					"og:image": "https://cdn.example/a.png",
					"product:price:amount": "12,50",
				},
				title: " Chair &#8211; Shop ",
			}),
			"https://shop.example/",
		),
	).toEqual({
		name: "Chair – Shop",
		priceCents: 1250,
		imageUrl: "https://cdn.example/a.png",
	});
});

test("ignores non-EUR prices and non-http images", () => {
	const product = pick(
		page({
			meta: {
				"og:price:amount": "10",
				"og:price:currency": "USD",
				"og:image": "javascript:alert(1)",
			},
		}),
		"https://shop.example/",
	);
	expect(product.priceCents).toBeNull();
	expect(product.imageUrl).toBeNull();
	expect(product.name).toBeNull();
});

test("image type comes from the bytes, SVG is refused", async () => {
	const bytes = (...b: number[]) => new Uint8Array(b);
	const ascii = (s: string) => new TextEncoder().encode(s);
	await expect(imageType(bytes(0xff, 0xd8, 0xff, 0xe0))).resolves.toBe(
		"image/jpeg",
	);
	// PNG signature + IHDR chunk header.
	const png = bytes(0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13);
	await expect(
		imageType(
			new Uint8Array([...png, ...ascii("IHDR"), 0, 0, 0, 1, 0, 0, 0, 1]),
		),
	).resolves.toBe("image/png");
	await expect(imageType(ascii("RIFF\0\0\0\0WEBPVP8 "))).resolves.toBe(
		"image/webp",
	);
	await expect(imageType(ascii("<svg onload=alert(1)>"))).rejects.toThrow();
	await expect(imageType(new Uint8Array(0))).rejects.toThrow();
});

test("decodes every named HTML entity", () => {
	expect(
		pick(page({ title: "Caf&eacute; &euro;5 &amp; more" }), "https://x/").name,
	).toBe("Café €5 & more");
});
