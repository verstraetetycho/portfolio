import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { useFieldContext } from "./context";
import { control, Field, fieldError } from "./field";

export function TextField({
	label,
	hint,
	optional,
	action,
	className,
	...props
}: Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange" | "onBlur" | "id" | "name"
> & {
	label: string;
	hint?: ReactNode;
	optional?: boolean;
	// Rendered right of the input, e.g. a "Fill in" button.
	action?: ReactNode;
}) {
	const field = useFieldContext<string>();
	const id = useId();
	const error = fieldError(field.state.meta);
	const input = (
		<input
			{...props}
			id={id}
			name={field.name}
			value={field.state.value}
			onChange={(event) => field.handleChange(event.target.value)}
			onBlur={field.handleBlur}
			aria-invalid={error ? true : undefined}
			aria-describedby={error || hint ? `${id}-message` : undefined}
			className={`${control} min-h-11`}
		/>
	);
	return (
		<Field
			id={id}
			label={label}
			hint={hint}
			error={error}
			optional={optional}
			className={className}
		>
			{action ? (
				<div className="flex gap-2">
					{input}
					{action}
				</div>
			) : (
				input
			)}
		</Field>
	);
}
