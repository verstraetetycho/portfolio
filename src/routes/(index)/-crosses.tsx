export function Crosses({ className = "" }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={`flex justify-between text-[22px] font-light leading-none text-[#6f6f6f] ${className}`}
		>
			<span>+</span>
			<span>+</span>
		</div>
	);
}
