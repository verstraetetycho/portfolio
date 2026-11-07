export const RIDGE_COUNT = 50;

// Deterministic contour lines, computed once at module load (SSR-safe).
const RIDGES = Array.from({ length: RIDGE_COUNT }, (_, i) => {
	const g = (
		u: number,
		d: number,
		cx: number,
		cz: number,
		sx: number,
		sz: number,
		a: number,
	) => a * Math.exp(-((u - cx) ** 2 / sx + (d - cz) ** 2 / sz));
	const d = i / (RIDGE_COUNT - 1);
	const base = 250 + d ** 1.25 * 430;
	let p = "";
	for (let x = -20; x <= 1460; x += 8) {
		const u = x / 1440;
		let h =
			g(u, d, 0.56, 0.1, 0.009, 0.04, 175) +
			g(u, d, 0.37, 0.26, 0.016, 0.05, 105) +
			g(u, d, 0.79, 0.2, 0.012, 0.04, 95) +
			g(u, d, 0.14, 0.38, 0.03, 0.06, 55);
		const mask = Math.min(1, h / 90);
		h +=
			mask * 28 * Math.abs(Math.sin(u * 31 + d * 9)) +
			mask * 14 * Math.abs(Math.sin(u * 73 - d * 17));
		h +=
			(6 + 16 * d) *
			(Math.sin(u * 9 + d * 11) * 0.6 + Math.sin(u * 21 - d * 6) * 0.4);
		p += `${x === -20 ? "M" : "L"}${x} ${(base - h).toFixed(1)}`;
	}
	return {
		d: `${p} L1460 760 L-20 760 Z`,
		o: (
			0.85 *
			(0.35 + 0.65 * (1 - Math.min(1, Math.abs(d - 0.2) * 1.4)))
		).toFixed(2),
	};
});

export function Ridges() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 1440 560"
			preserveAspectRatio="xMidYMax slice"
			className="absolute inset-0 block size-full"
		>
			{RIDGES.map((r) => (
				<path
					key={r.d}
					d={r.d}
					fill="#0a0a0a"
					stroke="#fff"
					strokeOpacity={r.o}
					vectorEffect="non-scaling-stroke"
				/>
			))}
		</svg>
	);
}
