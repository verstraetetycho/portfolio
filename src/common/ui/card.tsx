import type { ReactNode } from "react";
import { eyebrow } from "./text";

export function Card({
	title,
	description,
	tone = "default",
	children,
}: {
	title: string;
	description?: ReactNode;
	tone?: "default" | "danger";
	children: ReactNode;
}) {
	const border = tone === "danger" ? "border-[#ff8a8a]/25" : "border-white/10";
	return (
		<section className={`border bg-white/[0.02] ${border}`}>
			<header className={`border-b px-5 py-4 ${border}`}>
				<h2
					className={tone === "danger" ? `${eyebrow} text-[#ff8a8a]` : eyebrow}
				>
					{title}
				</h2>
				{description && (
					<p className="mt-1.5 text-sm text-[#9a9a9a]">{description}</p>
				)}
			</header>
			<div className="p-5">{children}</div>
		</section>
	);
}
