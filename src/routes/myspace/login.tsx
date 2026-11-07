import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/common/ui/button";
import { Panel } from "@/common/ui/panel";
import { useAction } from "@/common/ui/use-action";
import { authClient } from "@/domains/auth/client";
import { sessionStatus } from "@/domains/auth/server";

export const Route = createFileRoute("/myspace/login")({
	beforeLoad: async () => {
		if (await sessionStatus()) throw redirect({ to: "/myspace" });
	},
	component: Login,
});

// Reads an invite from `#invite=…` (created with `npm run myspace:invite`) and
// removes it from the address bar right away.
function useInvite() {
	const [invite, setInvite] = useState<string>();
	useEffect(() => {
		const token = new URLSearchParams(location.hash.slice(1)).get("invite");
		if (!token) return;
		setInvite(token);
		history.replaceState(null, "", location.pathname);
	}, []);
	return invite;
}

function Login() {
	const navigate = useNavigate();
	const invite = useInvite();
	const { busy, error, run } = useAction(
		invite ? "Couldn't create the passkey." : "Sign-in failed. Try again.",
	);

	const signIn = () =>
		run(async () => {
			const { error } = await authClient.signIn.passkey();
			if (error) throw error;
			await navigate({ to: "/myspace" });
		});

	const createPasskey = (token: string) =>
		run(async () => {
			// The invite is the credential here: the server checks it as `context`.
			const { error } = await authClient.passkey.addPasskey({
				context: token,
				createSession: true,
			});
			if (error) throw error;
			await navigate({ to: "/myspace" });
		});

	return (
		<>
			<div
				aria-hidden="true"
				className="dotgrid pointer-events-none fixed inset-0 -z-10"
			/>
			{invite ? (
				<Panel title="Create passkey" error={error}>
					<Button
						variant="primary"
						busy={busy}
						onClick={() => createPasskey(invite)}
					>
						{busy ? "Waiting for passkey…" : "Create passkey"}
					</Button>
				</Panel>
			) : (
				<Panel title="Sign in" error={error}>
					<Button variant="primary" busy={busy} onClick={signIn}>
						{busy ? "Waiting for passkey…" : "Sign in with passkey"}
					</Button>
				</Panel>
			)}
		</>
	);
}
