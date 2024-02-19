"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

import { Live } from "@/components/Live";
import Navbar from "./_components/Navbar";
import { LeftSidebar } from "./_components/LeftSidebar";
import { RightSidebar } from "./_components/RightSidebar";
import {
	handleCanvasMouseDown,
	handleResize,
	initializeFabric,
} from "@/lib/canvas";
import { ActiveElement } from "@/types/type";

const HomePage = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);
	const isDrawing = useRef(false);
	const shapeRef = useRef<fabric.Object | null>(null);
	const selectedShapeRef = useRef<string | null>("rectangle");

	const [activeElement, setActiveElement] = useState<ActiveElement>({
		name: "",
		value: "",
		icon: "",
	});

	const handleActiveElement = (elem: ActiveElement) => {
		setActiveElement(elem);

		selectedShapeRef.current = elem?.value as string;
	};

	useEffect(() => {
		const canvas = initializeFabric({ canvasRef, fabricRef });

		canvas.on("mouse:down", (options) => {
			handleCanvasMouseDown({
				options,
				canvas,
				isDrawing,
				shapeRef,
				selectedShapeRef,
			});
		});

		window.addEventListener("resize", () => {
			handleResize({ canvas: fabricRef.current });
		});
	}, []);

	return (
		<main className="h-screen overflow-hidden ">
			<Navbar
				activeElement={activeElement}
				handleActiveElement={handleActiveElement}
			/>

			<section className="flex flex-row h-full">
				<LeftSidebar />

				<Live canvasRef={canvasRef} />

				<RightSidebar />
			</section>
		</main>
	);
};

export default HomePage;
