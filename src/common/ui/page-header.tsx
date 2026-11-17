import type { ReactNode } from "react";
import { heading } from "./text";

export function PageHeader({
	title,
	description,
	eyebrow,
	actions,
}: {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
			<div className="min-w-0 flex-1">
				{eyebrow && <div className="mb-3">{eyebrow}</div>}
				{typeof title === "string" ? (
					<h1 className={heading}>{title}</h1>
				) : (
					title
				)}
				{description && (
					<p className="mt-2 text-sm text-[#9a9a9a]">{description}</p>
				)}
			</div>
			{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
		</header>
	);
}
