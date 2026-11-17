import { fileTypeFromBuffer } from "file-type";
import { Bucket } from "@/common/object-storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// No SVG: it can carry scripts.
const IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
]);

// The image type from the file's bytes, never from a client-supplied
// Content-Type.
export async function imageType(bytes: Uint8Array) {
	if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES)
		throw new TypeError("Invalid image");
	const type = (await fileTypeFromBuffer(bytes))?.mime;
	if (!type || !IMAGE_TYPES.has(type)) throw new TypeError("Invalid image");
	return type;
}

// A bucket that only accepts validated images.
class ImageBucket extends Bucket {
	// Stores image bytes under a fresh random key. Keys are never reused, so
	// the image route can cache forever.
	async putImage(bytes: Uint8Array<ArrayBuffer>) {
		const key = crypto.randomUUID();
		await this.put(key, bytes, await imageType(bytes));
		return key;
	}

	// Reads a response body as an image, giving up past MAX_IMAGE_BYTES.
	async putResponse(res: Response) {
		return this.putImage(await readCapped(res));
	}
}

export const images = new ImageBucket("wishlist-images");

async function readCapped(res: Response, max = MAX_IMAGE_BYTES) {
	if (!res.body) throw new TypeError("Invalid image");
	const chunks: Uint8Array[] = [];
	let size = 0;
	for await (const chunk of res.body) {
		size += chunk.length;
		if (size > max) throw new TypeError("Invalid image");
		chunks.push(chunk);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.length;
	}
	return bytes;
}
