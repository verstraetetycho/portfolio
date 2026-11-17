import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./button";

// Native <dialog>: focus trap, Escape and inert background for free.
// Children only render while open, so forms inside start fresh every time.
export function Dialog({
	open,
	onClose,
	title,
	description,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: ReactNode;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (open && !dialog?.open) dialog?.showModal();
		if (!open && dialog?.open) dialog.close();
	}, [open]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard equivalent is Escape, handled natively
		<dialog
			ref={ref}
			onClose={onClose}
			// A click on the backdrop lands on the <dialog> itself.
			onClick={(event) => event.target === ref.current && onClose()}
			aria-labelledby="dialog-title"
			className="m-auto w-[calc(100%-2rem)] max-w-lg border border-white/15 bg-[#0d0d0d] p-0 text-[#f2f2f2] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
		>
			{open && (
				<div className="p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2
								id="dialog-title"
								className="font-display text-2xl font-light tracking-[-0.02em]"
							>
								{title}
							</h2>
							{description && (
								<p className="mt-1 text-sm text-[#9a9a9a]">{description}</p>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Close"
							onClick={onClose}
							className="-mt-2 -mr-2"
						>
							<X aria-hidden="true" className="size-4" />
						</Button>
					</div>
					<div className="mt-6">{children}</div>
				</div>
			)}
		</dialog>
	);
}
