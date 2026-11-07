import { useState } from "react";

// Runs an async action with a busy flag and a generic error message.
export function useAction(fallbackError: string) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const run = async (action: () => Promise<unknown>) => {
		setBusy(true);
		setError(undefined);
		try {
			await action();
		} catch {
			setError(fallbackError);
		} finally {
			setBusy(false);
		}
	};
	return { busy, error, run };
}
