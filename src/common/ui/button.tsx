import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

const variants = {
	primary:
		"border-[#f2f2f2] bg-[#f2f2f2] text-[#0a0a0a] hover:border-white hover:bg-white",
	secondary: "sl border-white/25 text-[#f2f2f2]",
	ghost:
		"border-transparent text-[#9a9a9a] hover:bg-white/[0.06] hover:text-[#f2f2f2]",
	danger:
		"border-[#ff8a8a]/40 text-[#ff8a8a] hover:border-[#ff8a8a] hover:bg-[#ff8a8a] hover:text-[#0a0a0a]",
};

const sizes = {
	md: "min-h-11 px-4",
	sm: "min-h-9 px-3",
	icon: "size-10",
};

export type ButtonVariant = keyof typeof variants;

// For links and labels that should look like a button.
export const buttonClass = (
	variant: ButtonVariant = "secondary",
	size: keyof typeof sizes = "md",
) =>
	`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border text-xs uppercase tracking-[0.12em] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]}`;

export function Button({
	variant,
	size,
	busy,
	className = "",
	disabled,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: keyof typeof sizes;
	busy?: boolean;
}) {
	return (
		<button
			type="button"
			{...props}
			disabled={disabled || busy}
			aria-busy={busy || undefined}
			className={`${buttonClass(variant, size)} ${className}`}
		>
			{busy && (
				<LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
			)}
			{children}
		</button>
	);
}
