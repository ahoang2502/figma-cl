"use client";

import { Live } from "@/components/Live";
import Navbar from "./_components/Navbar";

const HomePage = () => {
	return (
		<main className="h-screen overflow-hidden ">
			<Navbar />

			<section className="flex flex-row h-full">
				<Live />
			</section>
		</main>
	);
};

export default HomePage;
