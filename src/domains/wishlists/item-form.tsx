import imageCompression from "browser-image-compression";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useId } from "react";
import { useDropzone } from "react-dropzone";
import { Alert } from "@/common/ui/alert";
import { Button } from "@/common/ui/button";
import { Field } from "@/common/ui/form/field";
import { useAppForm } from "@/common/ui/form/use-app-form";
import { useAction } from "@/common/ui/use-action";
import { imageSrc } from "./item";
import { fetchProduct, type getWishlist, uploadImage } from "./server";

type Item = Awaited<ReturnType<typeof getWishlist>>["items"][number];

// Strings as typed; the server parses and validates them again.
export type ItemValues = {
	url: string;
	name: string;
	price: string;
	note: string;
	imageKey: string;
};

// The types the server accepts (images.ts); anything else fails before uploading.
const IMAGE_TYPES = {
	"image/jpeg": [],
	"image/png": [],
	"image/webp": [],
	"image/gif": [],
	"image/avif": [],
};

// Shrinks and re-encodes before upload, so the server's 5 MB cap is never hit
// and EXIF (GPS etc.) is stripped. WebP keeps transparency; browsers that
// can't encode it fall back to PNG, which maxSizeMB still keeps small.
// No web worker: it loads the library from a CDN, which the CSP blocks.
// ponytail: animated GIFs become still images; skip compression for GIFs if that matters.
const compress = (file: File) =>
	imageCompression(file, {
		maxSizeMB: 1,
		maxWidthOrHeight: 1600,
		fileType: "image/webp",
		initialQuality: 0.85,
		useWebWorker: false,
	});

const isHttpUrl = (value: string) => {
	try {
		return ["http:", "https:"].includes(new URL(value).protocol);
	} catch {
		return false;
	}
};

export function ItemForm({
	item,
	submitLabel,
	onSubmit,
	onCancel,
}: {
	item?: Item;
	submitLabel: string;
	onSubmit: (values: ItemValues) => Promise<void>;
	onCancel: () => void;
}) {
	const imageId = useId();
	const save = useAction("Couldn't save the item.");
	const fill = useAction(
		"Couldn't read that page. Fill in the details yourself.",
	);
	const upload = useAction(
		"Couldn't use that image. Try a JPG, PNG, WebP, GIF or AVIF.",
	);

	const form = useAppForm({
		defaultValues: {
			url: item?.url ?? "",
			name: item?.name ?? "",
			price: item?.priceCents == null ? "" : String(item.priceCents / 100),
			note: item?.note ?? "",
			imageKey: item?.imageKey ?? "",
		} satisfies ItemValues,
		onSubmit: ({ value }) => save.run(() => onSubmit(value)),
	});

	// Fills in what's still empty, so it never overwrites your own edits.
	const autofill = (url: string) => {
		if (!isHttpUrl(url)) return;
		fill.run(async () => {
			const product = await fetchProduct({ data: { url } });
			if (product.name && !form.getFieldValue("name"))
				form.setFieldValue("name", product.name);
			if (product.priceCents !== null && !form.getFieldValue("price"))
				form.setFieldValue("price", String(product.priceCents / 100));
			if (product.imageKey && !form.getFieldValue("imageKey"))
				form.setFieldValue("imageKey", product.imageKey);
		});
	};

	return (
		<form
			noValidate
			className="flex flex-col gap-5"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="imageKey">
				{(field) => (
					<Field id={imageId} label="Image" optional>
						<ImageDrop
							id={imageId}
							imageKey={field.state.value}
							busy={upload.busy}
							onFile={(file) =>
								upload.run(async () => {
									if (!file) throw new Error("Rejected file");
									const data = new FormData();
									data.append("image", await compress(file));
									field.handleChange(await uploadImage({ data }));
								})
							}
							onRemove={() => field.handleChange("")}
						/>
					</Field>
				)}
			</form.Field>

			<form.AppField
				name="url"
				validators={{
					onBlur: ({ value }) =>
						value.trim() && !isHttpUrl(value.trim())
							? "Use a full link, starting with https://"
							: undefined,
				}}
			>
				{(field) => (
					<field.TextField
						label="Link"
						type="url"
						inputMode="url"
						maxLength={2000}
						placeholder="https://"
						optional
						hint="Paste a product link to fill in the name, price and image."
						onPaste={(event) =>
							autofill(event.clipboardData.getData("text").trim())
						}
						action={
							<Button
								busy={fill.busy}
								onClick={() => autofill(field.state.value.trim())}
							>
								Fill in
							</Button>
						}
					/>
				)}
			</form.AppField>

			<div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
				<form.AppField
					name="name"
					validators={{
						onChange: ({ value }) =>
							!value.trim() ? "Give it a name." : undefined,
					}}
				>
					{(field) => (
						<field.TextField
							label="Product"
							maxLength={200}
							placeholder="e.g. Desk lamp"
						/>
					)}
				</form.AppField>
				<form.AppField
					name="price"
					validators={{
						onBlur: ({ value }) =>
							value && !(Number(value) >= 0)
								? "Enter an amount like 24.99."
								: undefined,
					}}
				>
					{(field) => (
						<field.TextField
							label="Price (€)"
							type="number"
							inputMode="decimal"
							min="0"
							step="0.01"
							placeholder="0.00"
							optional
						/>
					)}
				</form.AppField>
			</div>

			<form.AppField name="note">
				{(field) => (
					<field.TextareaField
						label="Note"
						maxLength={1000}
						placeholder="Size, colour, where to buy…"
						optional
					/>
				)}
			</form.AppField>

			<Alert>{save.error ?? fill.error ?? upload.error}</Alert>

			<div className="flex justify-end gap-2 border-t border-white/10 pt-5">
				<Button variant="ghost" onClick={onCancel}>
					Cancel
				</Button>
				<form.AppForm>
					<form.SubmitButton requireChanges={Boolean(item)}>
						{submitLabel}
					</form.SubmitButton>
				</form.AppForm>
			</div>
		</form>
	);
}

// Drop or pick one image; `onFile(null)` means the file was rejected.
function ImageDrop({
	id,
	imageKey,
	busy,
	onFile,
	onRemove,
}: {
	id: string;
	imageKey: string;
	busy: boolean;
	onFile: (file: File | null) => void;
	onRemove: () => void;
}) {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: IMAGE_TYPES,
		multiple: false,
		disabled: busy,
		onDropAccepted: ([file]) => onFile(file),
		onDropRejected: () => onFile(null),
	});

	return (
		<div className="flex flex-col gap-2">
			<div
				{...getRootProps({
					className: `relative flex h-44 cursor-pointer items-center justify-center overflow-hidden border transition-colors focus:outline-none focus-visible:border-[#f2f2f2] ${
						isDragActive
							? "border-solid border-[#f2f2f2] bg-white/[0.06]"
							: "border-dashed border-white/20 bg-white/[0.02] hover:border-white/40 hover:bg-white/[0.04]"
					} ${busy ? "cursor-wait" : ""}`,
				})}
			>
				<input {...getInputProps({ id })} />
				{imageKey && (
					<img
						src={imageSrc(imageKey)}
						alt=""
						className={`h-full w-full bg-white object-contain transition-opacity ${
							isDragActive || busy ? "opacity-20" : ""
						}`}
					/>
				)}
				{(!imageKey || isDragActive || busy) && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-[#9a9a9a]">
						{busy ? (
							<LoaderCircle
								aria-hidden="true"
								className="size-5 animate-spin"
							/>
						) : (
							<ImagePlus aria-hidden="true" className="size-5" />
						)}
						<span className="text-[#f2f2f2]">
							{busy
								? "Uploading…"
								: isDragActive
									? "Drop to upload"
									: "Drop an image here, or click to browse"}
						</span>
						{!busy && !isDragActive && (
							<span className="text-[#6b6b6b]">
								JPG, PNG, WebP, GIF or AVIF
							</span>
						)}
					</div>
				)}
			</div>
			{imageKey && !busy && (
				<div className="flex items-center justify-between text-xs text-[#6b6b6b]">
					Drop or click the image to replace it.
					<Button variant="ghost" size="sm" onClick={onRemove}>
						Remove
					</Button>
				</div>
			)}
		</div>
	);
}
