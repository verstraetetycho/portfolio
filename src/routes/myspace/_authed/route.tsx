import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Gift, LogOut } from "lucide-react";
import { Alert } from "@/common/ui/alert";
import { Brand } from "@/common/ui/brand";
import { Button } from "@/common/ui/button";
import { useAction } from "@/common/ui/use-action";
import { authClient } from "@/domains/auth/client";
import { sessionStatus } from "@/domains/auth/server";

// Convenience redirect only. Server functions enforce the session themselves.
export const Route = createFileRoute("/myspace/_authed")({
	beforeLoad: async () => {
		if (!(await sessionStatus())) throw redirect({ to: "/myspace/login" });
	},
	component: Dashboard,
});

// One entry per dashboard section.
const sections = [
	{ to: "/myspace/wishlists", label: "Wishlists", Icon: Gift },
] as const;

function Dashboard() {
	const navigate = useNavigate();
	const { busy, error, run } = useAction("Couldn't log out.");

	const signOut = () =>
		run(async () => {
			const { error } = await authClient.signOut();
			if (error) throw error;
			await navigate({ to: "/myspace/login" });
		});

	return (
		<div className="flex min-h-screen flex-col md:flex-row">
			<aside className="flex flex-wrap items-center gap-4 border-b border-white/10 bg-[#0d0d0d] p-4 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:flex-nowrap md:items-stretch md:border-r md:border-b-0 md:p-5">
				<Link to="/myspace" className="no-underline">
					<Brand />
				</Link>
				<nav aria-label="Dashboard" className="flex gap-1 md:mt-8 md:flex-col">
					{sections.map(({ to, label, Icon }) => (
						<Link
							key={to}
							to={to}
							className="flex min-h-10 items-center gap-3 border-l-2 border-transparent px-3 text-sm text-[#9a9a9a] no-underline transition-colors hover:bg-white/[0.04] hover:text-[#f2f2f2]"
							activeProps={{
								className: "border-[#f2f2f2]! bg-white/[0.06] text-[#f2f2f2]!",
							}}
						>
							<Icon aria-hidden="true" className="size-4" />
							{label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex flex-col gap-2 md:mt-auto md:ml-0">
					<Button variant="ghost" busy={busy} onClick={signOut}>
						<LogOut aria-hidden="true" className="size-4" /> Log out
					</Button>
					<Alert>{error}</Alert>
				</div>
			</aside>
			<main className="min-w-0 flex-1 p-6 md:p-10">
				<Outlet />
			</main>
		</div>
	);
}
