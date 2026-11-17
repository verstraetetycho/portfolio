import type { ReactNode } from "react";
import { Alert } from "./alert";
import { Brand } from "./brand";
import { heading } from "./text";

// Centered card for standalone pages (sign-in, errors).
export function Panel({
	title,
	error,
	children,
}: {
	title: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-sm border border-white/15 bg-[#0d0d0d] p-8">
				<Brand />
				<h1 className={`mt-3 ${heading}`}>{title}</h1>
				<div className="mt-8 flex flex-col gap-3">{children}</div>
				<div className="mt-4 empty:hidden">
					<Alert>{error}</Alert>
				</div>
			</div>
		</main>
	);
}
