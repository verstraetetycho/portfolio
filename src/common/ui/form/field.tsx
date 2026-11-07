import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export const control =
	"w-full border border-white/15 bg-white/[0.03] px-3 text-sm text-[#f2f2f2] transition-colors placeholder:text-[#6b6b6b] hover:border-white/30 focus:border-[#f2f2f2] focus:bg-white/[0.05] focus:outline-none aria-invalid:border-[#ff8a8a]/70 disabled:opacity-40";

// Label, control, then a hint or an error. `id` must match the control's id.
export function Field({
	id,
	label,
	hint,
	error,
	optional,
	className = "",
	children,
}: {
	id: string;
	label: string;
	hint?: ReactNode;
	error?: string;
	optional?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<label
				htmlFor={id}
				className="flex items-baseline justify-between text-xs uppercase tracking-[0.12em] text-[#9a9a9a]"
			>
				{label}
				{optional && (
					<span className="normal-case tracking-normal text-[#6b6b6b]">
						optional
					</span>
				)}
			</label>
			{children}
			{error ? (
				<p
					id={`${id}-message`}
					className="flex items-center gap-1.5 text-xs text-[#ff8a8a]"
				>
					<CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
					{error}
				</p>
			) : (
				hint && (
					<p id={`${id}-message`} className="text-xs text-[#6b6b6b]">
						{hint}
					</p>
				)
			)}
		</div>
	);
}

// The first error once the user has interacted with the field (or tried to submit).
export function fieldError(meta: { isTouched: boolean; errors: unknown[] }) {
	const [error] = meta.errors;
	return meta.isTouched && error ? String(error) : undefined;
}
