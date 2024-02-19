"use client";

import { use, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

import { Live } from "@/components/Live";
import Navbar from "./_components/Navbar";
import { LeftSidebar } from "./_components/LeftSidebar";
import { RightSidebar } from "./_components/RightSidebar";
import {
	handleCanvasMouseDown,
	handleCanvasMouseUp,
	handleCanvasMouseMove,
	handleResize,
	initializeFabric,
	renderCanvas,
	handleCanvasObjectModified,
} from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { useMutation, useStorage } from "@/liveblocks.config";

const HomePage = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);
	const isDrawing = useRef(false);
	const shapeRef = useRef<fabric.Object | null>(null);
	const selectedShapeRef = useRef<string | null>("rectangle");
	const activeObjectRef = useRef<fabric.Object | null>(null);

	const [activeElement, setActiveElement] = useState<ActiveElement>({
		name: "",
		value: "",
		icon: "",
	});

	const canvasObjects = useStorage((root) => root.canvasObjects);

	const syncShapeInStorage = useMutation(({ storage }, object) => {
		if (!object) return;

		const { objectId } = object;
		const shapeData = object.toJSON();
		shapeData.objectId = objectId;

		const canvasObjects = storage.get("canvasObjects");
		canvasObjects.set(objectId, shapeData);
	}, []);

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
		canvas.on("mouse:move", (options) => {
			handleCanvasMouseMove({
				options,
				canvas,
				isDrawing,
				shapeRef,
				selectedShapeRef,
				syncShapeInStorage,
			});
		});
		canvas.on("mouse:up", (options) => {
			handleCanvasMouseUp({
				canvas,
				isDrawing,
				shapeRef,
				selectedShapeRef,
				syncShapeInStorage,
				setActiveElement,
				activeObjectRef,
			});
		});
		canvas.on("mouse:modified", (options) => {
			handleCanvasObjectModified({
				options,
				syncShapeInStorage,
			});
		});

		window.addEventListener("resize", () => {
			handleResize({ canvas: fabricRef.current });
		});
	}, []);

	useEffect(() => {
		renderCanvas({
			fabricRef,
			canvasObjects,
			activeObjectRef,
		});
	}, [canvasObjects]);

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
