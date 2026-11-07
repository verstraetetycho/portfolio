import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "../button";
import { useFormContext } from "./context";

export function SubmitButton({
	children,
	variant = "primary",
	requireChanges,
}: {
	children: ReactNode;
	variant?: ButtonVariant;
	// Disabled until a field differs from its default, e.g. for edit forms.
	requireChanges?: boolean;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}
		>
			{([isSubmitting, isDefaultValue]) => (
				<Button
					type="submit"
					variant={variant}
					busy={isSubmitting}
					disabled={requireChanges && isDefaultValue}
				>
					{children}
				</Button>
			)}
		</form.Subscribe>
	);
}
