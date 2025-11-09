import { createFileRoute } from "@tanstack/react-router";
import { SocialIcon } from "react-social-icons";
import "react-social-icons/linkedin";
import "react-social-icons/github";
import "react-social-icons/whatsapp";
import "react-social-icons/email";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<>
			<div className="flex flex-col justify-center items-center h-screen text-center gap-10">
				<img
					className="w-48 rounded-full"
					src="/tycho.png"
					alt="Tycho Verstraete portrait"
				/>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<h1 className="text-6xl font-bold">Hi, I'm Tycho</h1>
						<span className="text-xl">I like building digital stuff</span>
					</div>
					<div className="flex justify-center gap-4">
						<SocialIcon
							url="https://www.linkedin.com/in/tycho-verstraete-a5ab1b174/"
							target="__blank"
						/>
						<SocialIcon
							url="https://github.com/verstraetetycho"
							target="__blank"
						/>
						<SocialIcon url="https://wa.me/32472860978" target="__blank" />
						<SocialIcon url="mailto:tycho@tychoverstraete.be" />
					</div>
				</div>
			</div>
		</>
	);
}
