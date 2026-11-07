import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { Github, Linkedin } from "./-brand-icons";

export const LINKS = [
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/in/tycho-verstraete-a5ab1b174/",
		Icon: Linkedin,
	},
	{ label: "GitHub", href: "https://github.com/verstraetetycho", Icon: Github },
	{ label: "WhatsApp", href: "https://wa.me/32472860978", Icon: MessageCircle },
	{ label: "Email", href: "mailto:tycho@tychoverstraete.be", Icon: Mail },
];

export function SocialLinks() {
	return (
		<nav aria-label="Social links" className="mt-9 flex flex-wrap gap-2.5">
			{LINKS.map(({ label, href, Icon }) => (
				<a
					key={label}
					href={href}
					target={href.startsWith("http") ? "_blank" : undefined}
					rel="noreferrer"
					className="sl inline-flex min-h-11 items-center gap-2.5 border border-white/30 px-4 text-xs uppercase tracking-[0.12em] no-underline"
				>
					<Icon
						aria-hidden="true"
						className="sl-icon"
						size={16}
						strokeWidth={1.5}
					/>
					<span>{label}</span>
					<ArrowUpRight
						aria-hidden="true"
						className="sl-arrow"
						size={12}
						strokeWidth={1.5}
					/>
				</a>
			))}
		</nav>
	);
}
