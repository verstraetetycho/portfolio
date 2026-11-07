import { type ReactNode, type TextareaHTMLAttributes, useId } from "react";
import { useFieldContext } from "./context";
import { control, Field, fieldError } from "./field";

export function TextareaField({
	label,
	hint,
	optional,
	className,
	...props
}: Omit<
	TextareaHTMLAttributes<HTMLTextAreaElement>,
	"value" | "onChange" | "onBlur" | "id" | "name"
> & { label: string; hint?: ReactNode; optional?: boolean }) {
	const field = useFieldContext<string>();
	const id = useId();
	const error = fieldError(field.state.meta);
	return (
		<Field
			id={id}
			label={label}
			hint={hint}
			error={error}
			optional={optional}
			className={className}
		>
			<textarea
				rows={3}
				{...props}
				id={id}
				name={field.name}
				value={field.state.value}
				onChange={(event) => field.handleChange(event.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={error ? true : undefined}
				aria-describedby={error || hint ? `${id}-message` : undefined}
				className={`${control} resize-y py-2.5`}
			/>
		</Field>
	);
}
