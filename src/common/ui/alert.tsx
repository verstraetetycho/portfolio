import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function Alert({ children }: { children?: ReactNode }) {
	if (!children) return null;
	return (
		<p
			role="alert"
			className="flex items-start gap-2 border border-[#ff8a8a]/30 bg-[#ff8a8a]/[0.06] px-3 py-2.5 text-sm text-[#ff8a8a]"
		>
			<CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
			<span>{children}</span>
		</p>
	);
}
