import { env } from "cloudflare:workers";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	NoSuchKey,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

// Neon Object Storage (S3-compatible). Branch-scoped credentials come from
// `neon env pull` locally and wrangler secrets in production. Declare each
// bucket in neon.ts, then: const files = new Bucket("name").
// Env is read on first use, not at module load.
export class Bucket {
	#client?: S3Client;

	constructor(readonly name: string) {}

	// The raw S3 client, for anything not wrapped here (presigning, listing, …).
	get client() {
		this.#client ??= new S3Client({
			region: env.AWS_REGION,
			endpoint: env.AWS_ENDPOINT_URL_S3,
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
			// Neon's settings: path-style addressing, and no default checksums
			// (they break presigned PUTs).
			forcePathStyle: true,
			requestChecksumCalculation: "WHEN_REQUIRED",
			responseChecksumValidation: "WHEN_REQUIRED",
		});
		return this.#client;
	}

	async put(key: string, body: Uint8Array, contentType: string) {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.name,
				Key: key,
				Body: body,
				ContentType: contentType,
			}),
		);
	}

	// null when the key doesn't exist.
	async get(key: string) {
		try {
			const object = await this.client.send(
				new GetObjectCommand({ Bucket: this.name, Key: key }),
			);
			if (!object.Body) return null;
			return {
				body: object.Body.transformToWebStream(),
				contentType: object.ContentType,
			};
		} catch (error) {
			if (error instanceof NoSuchKey) return null;
			throw error;
		}
	}

	// Skips null keys, so nullable columns can be passed straight in.
	async delete(keys: (string | null)[]) {
		await Promise.all(
			keys.flatMap((key) =>
				key
					? [
							this.client.send(
								new DeleteObjectCommand({ Bucket: this.name, Key: key }),
							),
						]
					: [],
			),
		);
	}
}
