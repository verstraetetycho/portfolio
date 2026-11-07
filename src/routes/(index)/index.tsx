import { createFileRoute } from "@tanstack/react-router";
import { Crosses } from "./-crosses";
import { head } from "./-head";
import { RIDGE_COUNT, Ridges } from "./-ridges";
import { SocialLinks } from "./-social-links";

export const Route = createFileRoute("/(index)/")({ head, component: App });

const wrap = "mx-auto w-full max-w-[1280px] px-[clamp(20px,4vw,48px)]";
const label = "text-[11px] uppercase tracking-[0.12em]";

function App() {
	return (
		<div id="top" className="relative min-h-screen overflow-hidden">
			<div
				aria-hidden="true"
				className="dotgrid absolute inset-x-0 top-0 h-225"
			/>

			<section className="relative flex min-h-screen flex-col">
				<div className={`relative z-2 pt-7 ${wrap}`}>
					<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs uppercase tracking-widest">
						<a
							href="#top"
							className="inline-flex min-h-11 items-center gap-3 no-underline"
						>
							<span className="inline-flex size-8 items-center justify-center border border-[#f2f2f2] text-sm tracking-normal">
								T/
							</span>
							<span>Tycho ©2026</span>
						</a>
						<span className="text-center text-[#9a9a9a]">
							Portfolio / Software engineer
						</span>
						<span className="text-[#9a9a9a]">[ Index 01 — Home ]</span>
					</header>
					<Crosses className="mt-6" />

					<div className="mt-10 flex flex-wrap items-center gap-x-18 gap-y-12">
						<figure className="m-0 flex w-65 flex-none flex-col items-center gap-4.5">
							<div className="relative size-65">
								<svg
									aria-hidden="true"
									className="spin absolute inset-0"
									viewBox="0 0 260 260"
								>
									<circle
										cx="130"
										cy="130"
										r="128"
										fill="none"
										stroke="#fff"
										strokeOpacity="0.45"
										strokeDasharray="2 6"
									/>
									<circle cx="130" cy="2" r="3" fill="#fff" />
								</svg>
								<img
									src="/tycho.png"
									width={216}
									height={216}
									fetchPriority="high"
									alt="Portrait of Tycho Verstraete"
									className="absolute top-5.5 left-5.5 size-54 rounded-full object-cover grayscale contrast-[1.08]"
								/>
							</div>
							<figcaption className={`${label} text-[#9a9a9a]`}>
								Fig. 01 — portrait.png
							</figcaption>
						</figure>

						<div className="min-w-0 flex-[1_1_460px]">
							<p className="text-sm text-[#9a9a9a]">
								~/tycho <span className="text-[#f2f2f2]">$</span> whoami
							</p>
							<h1 className="font-display mt-3.5 text-[clamp(54px,8.2vw,124px)] font-light leading-[0.95] tracking-[-0.045em]">
								Hi, I’m Tycho
							</h1>
							<p className="mt-5.5 text-lg leading-normal text-[#d6d6d6]">
								I like building digital stuff
								<span className="blink text-white">_</span>
							</p>

							<SocialLinks />
						</div>
					</div>
				</div>

				<div className="relative mt-2 min-h-90 flex-[1_0_auto]">
					<Ridges />
					<div
						className={`absolute inset-x-0 bottom-5 z-2 flex justify-end text-[#b8b8b8] ${label} ${wrap}`}
					>
						<span>terrain.gen — {RIDGE_COUNT} contours</span>
					</div>
				</div>
			</section>
		</div>
	);
}
