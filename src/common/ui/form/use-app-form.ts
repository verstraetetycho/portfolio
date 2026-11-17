import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

// Every dashboard form: `form.AppField` renders these fields with label,
// hint and error built in; `form.SubmitButton` tracks the submitting state.
export const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: { TextField, TextareaField },
	formComponents: { SubmitButton },
});
