import { Link } from "@tanstack/react-router";
import { eyebrow } from "./text";

export function Brand({ label = "~/myspace" }: { label?: string }) {
	return (
		<div className="flex items-center gap-3">
			<Link
				to="/"
				aria-label="Tycho Verstraete — home"
				className="inline-flex size-8 items-center justify-center border border-[#f2f2f2] text-sm"
			>
				T/
			</Link>
			<span className={eyebrow}>{label}</span>
		</div>
	);
}
