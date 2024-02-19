"use client";

import { Live } from "@/components/Live";
import Navbar from "./_components/Navbar";
import { LeftSidebar } from "./_components/LeftSidebar";
import { RightSidebar } from "./_components/RightSidebar";

const HomePage = () => {
	return (
		<main className="h-screen overflow-hidden ">
			<Navbar />

			<section className="flex flex-row h-full">
				<LeftSidebar />

				<Live />

				<RightSidebar />
			</section>
		</main>
	);
};

export default HomePage;
