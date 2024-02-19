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
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

const HomePage = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);
	const isDrawing = useRef(false);
	const shapeRef = useRef<fabric.Object | null>(null);
	const selectedShapeRef = useRef<string | null>(null);
	const activeObjectRef = useRef<fabric.Object | null>(null);

	const imageInputRef = useRef<HTMLInputElement>(null);

	const [activeElement, setActiveElement] = useState<ActiveElement>({
		name: "",
		value: "",
		icon: "",
	});

	const canvasObjects = useStorage((root) => root.canvasObjects);
	const undo = useUndo();
	const redo = useRedo();

	const syncShapeInStorage = useMutation(({ storage }, object) => {
		if (!object) return;

		const { objectId } = object;
		const shapeData = object.toJSON();
		shapeData.objectId = objectId;

		const canvasObjects = storage.get("canvasObjects");
		canvasObjects.set(objectId, shapeData);
	}, []);

	const deleteAllShapes = useMutation(({ storage }) => {
		const canvasObjects = storage.get("canvasObjects");

		if (!canvasObjects || canvasObjects.size === 0) return true;

		for (const [key, value] of canvasObjects.entries()) {
			canvasObjects.delete(key);
		}

		return canvasObjects.size === 0;
	}, []);

	const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
		const canvasObjects = storage.get("canvasObjects");

		canvasObjects.delete(objectId);
	}, []);

	const handleActiveElement = (elem: ActiveElement) => {
		setActiveElement(elem);

		switch (elem?.value) {
			case "reset":
				deleteAllShapes();
				fabricRef.current?.clear();

				setActiveElement(defaultNavElement);
				break;

			case "delete":
				handleDelete(fabricRef.current as any, deleteShapeFromStorage);

				setActiveElement(defaultNavElement);
				break;

			case "image":
				imageInputRef.current?.click();
				isDrawing.current = false;

				if (fabricRef.current) {
					fabricRef.current.isDrawingMode = false;
				}
				break;

			default:
				break;
		}

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

		window.addEventListener("keydown", (e: any) => {
			handleKeyDown({
				e,
				canvas: fabricRef.current,
				syncShapeInStorage,
				deleteShapeFromStorage,
				undo,
				redo,
			});
		});

		return () => {
			canvas.dispose();
		};
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
				imageInputRef={imageInputRef}
				handleImageUpload={(e: any) => {
					e.stopPropagation();

					handleImageUpload({
						file: e.target.files[0],
						canvas: fabricRef as any,
						shapeRef,
						syncShapeInStorage,
					});
				}}
			/>

			<section className="flex flex-row h-full">
				<LeftSidebar allShapes={Array.from(canvasObjects)} />

				<Live canvasRef={canvasRef} />

				<RightSidebar />
			</section>
		</main>
	);
};

export default HomePage;
