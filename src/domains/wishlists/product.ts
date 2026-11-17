// Reads name, price and image from a product page: JSON-LD (schema.org
// Product) first, then Open Graph / meta tags, then <title>.
// ponytail: some big shops block non-browser fetches; then nothing is filled
// in and you type it yourself. Add a scraping API if that gets annoying.

import { decodeHTML } from "entities";

type Json = Record<string, unknown>;

export type PageData = {
	meta: Record<string, string>;
	jsonLd: string[];
	title: string;
};

const HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (compatible; WishlistPreview/1.0; +https://tychoverstraete.be)",
	Accept: "text/html,application/xhtml+xml",
	"Accept-Language": "nl-BE,nl;q=0.9,en;q=0.8",
};

export class ProductPage {
	readonly #product: Json | undefined;
	readonly #offer: Json | undefined;

	constructor(
		readonly page: PageData,
		readonly url: string,
	) {
		this.#product = page.jsonLd
			.flatMap(parseJson)
			.flatMap(nodes)
			.find((node) => [node["@type"]].flat().includes("Product"));
		this.#offer = first(this.#product?.offers) as Json | undefined;
	}

	// A plain GET that looks enough like a browser for most shops.
	static request(url: string, accept = HEADERS.Accept) {
		return fetch(url, {
			headers: { ...HEADERS, Accept: accept },
			redirect: "follow",
			signal: AbortSignal.timeout(8000),
		});
	}

	static async fetch(url: string) {
		const res = await ProductPage.request(url);
		if (!res.ok || !res.headers.get("Content-Type")?.includes("html"))
			throw new Error(`Product page: ${res.status}`);
		return new ProductPage(await ProductPage.read(res), res.url);
	}

	static async read(res: Response): Promise<PageData> {
		const page: PageData = { meta: {}, jsonLd: [], title: "" };
		// Amazon has no JSON-LD or Open Graph; its product markup fills the
		// same meta keys, below any real meta tags.
		const amazon: Record<string, string> = {};
		const keep = (key: string, value: string | null) => {
			if (value && !(key in amazon)) amazon[key] = value;
		};
		let productTitle = "";
		await new HTMLRewriter()
			.on("#productTitle", {
				text(chunk) {
					productTitle += chunk.text;
				},
			})
			.on('input[name$="[customerVisiblePrice][amount]"]', {
				element(el) {
					keep("product:price:amount", el.getAttribute("value"));
				},
			})
			.on('input[name$="[customerVisiblePrice][currencyCode]"]', {
				element(el) {
					keep("product:price:currency", el.getAttribute("value"));
				},
			})
			.on("#landingImage", {
				element(el) {
					keep(
						"og:image",
						el.getAttribute("data-old-hires") || el.getAttribute("src"),
					);
				},
			})
			.on("meta", {
				element(el) {
					const key = (
						el.getAttribute("property") ??
						el.getAttribute("name") ??
						el.getAttribute("itemprop")
					)?.toLowerCase();
					const value = el.getAttribute("content");
					if (key && value && !(key in page.meta)) page.meta[key] = value;
				},
			})
			.on('script[type="application/ld+json"]', {
				element() {
					page.jsonLd.push("");
				},
				text(chunk) {
					page.jsonLd[page.jsonLd.length - 1] += chunk.text;
				},
			})
			.on("head > title", {
				text(chunk) {
					page.title += chunk.text;
				},
			})
			.transform(res)
			.arrayBuffer();
		keep("og:title", productTitle.trim());
		page.meta = { ...amazon, ...page.meta };
		return page;
	}

	get name() {
		const { meta, title } = this.page;
		return (
			(
				str(this.#product?.name) ??
				str(meta["og:title"]) ??
				str(meta["twitter:title"]) ??
				str(title)
			)?.slice(0, 200) ?? null
		);
	}

	// EUR only; a price in another currency would be misleading.
	get priceCents() {
		const { meta } = this.page;
		const currency =
			str(this.#offer?.priceCurrency) ??
			meta["product:price:currency"] ??
			meta["og:price:currency"];
		if (currency && currency.toUpperCase() !== "EUR") return null;
		const raw =
			str(this.#offer?.price) ??
			str(this.#offer?.lowPrice) ??
			meta["product:price:amount"] ??
			meta["og:price:amount"] ??
			meta.price;
		if (!raw) return null;
		const amount = Number(raw.replace(/[^\d.,]/g, "").replace(",", "."));
		return Number.isFinite(amount) && amount >= 0
			? Math.round(amount * 100)
			: null;
	}

	// Absolute http(s) only.
	get imageUrl() {
		const { meta } = this.page;
		const image = first(this.#product?.image);
		const raw =
			str(typeof image === "object" ? (image as Json)?.url : image) ??
			str(meta["og:image"]) ??
			str(meta["og:image:secure_url"]) ??
			str(meta["twitter:image"]);
		if (!raw) return null;
		try {
			const url = new URL(raw, this.url);
			return url.protocol === "https:" || url.protocol === "http:"
				? url.href
				: null;
		} catch {
			return null;
		}
	}

	toJSON() {
		return {
			name: this.name,
			priceCents: this.priceCents,
			imageUrl: this.imageUrl,
		};
	}
}

// HTMLRewriter hands over raw HTML text, so "&amp;" etc. are still encoded.
const decode = (value: string) => decodeHTML(value).replace(/\s+/g, " ").trim();

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const str = (value: unknown) =>
	typeof value === "string" || typeof value === "number"
		? decode(String(value)) || undefined
		: undefined;

function parseJson(raw: string): unknown[] {
	try {
		return [JSON.parse(raw)];
	} catch {
		return [];
	}
}

// JSON-LD nests: arrays, @graph, Product inside WebPage.mainEntity, …
const nodes = (value: unknown): Json[] =>
	Array.isArray(value)
		? value.flatMap(nodes)
		: value && typeof value === "object"
			? [
					value as Json,
					...nodes((value as Json)["@graph"]),
					...nodes((value as Json).mainEntity),
				]
			: [];
