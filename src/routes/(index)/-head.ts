import { LINKS } from "./-social-links";

const SITE_URL = "https://tychoverstraete.be/";
const TITLE = "Tycho Verstraete — Software engineer";
const DESCRIPTION =
	"Tycho Verstraete, software engineer who likes building digital stuff. Get in touch via LinkedIn, GitHub, WhatsApp or email.";
const IMAGE = `${SITE_URL}tycho.png`;

export const head = () => ({
	meta: [
		{ title: TITLE },
		{ name: "description", content: DESCRIPTION },
		{ property: "og:type", content: "profile" },
		{ property: "og:url", content: SITE_URL },
		{ property: "og:title", content: TITLE },
		{ property: "og:description", content: DESCRIPTION },
		{ property: "og:image", content: IMAGE },
		{ property: "og:image:alt", content: "Portrait of Tycho Verstraete" },
		{ property: "profile:first_name", content: "Tycho" },
		{ property: "profile:last_name", content: "Verstraete" },
		{ name: "twitter:card", content: "summary" },
	],
	links: [{ rel: "canonical", href: SITE_URL }],
	scripts: [
		{
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Person",
				name: "Tycho Verstraete",
				jobTitle: "Software engineer",
				url: SITE_URL,
				image: IMAGE,
				sameAs: LINKS.filter((l) =>
					["LinkedIn", "GitHub"].includes(l.label),
				).map((l) => l.href),
			}),
		},
	],
});
