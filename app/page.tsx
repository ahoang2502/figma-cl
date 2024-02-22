"use client";

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

import { Live } from "@/components/Live";
import { defaultNavElement } from "@/constants";
import {
	handleCanvasMouseDown,
	handleCanvasMouseMove,
	handleCanvasMouseUp,
	handleCanvasObjectModified,
	handleCanvasObjectScaling,
	handleCanvasSelectionCreated,
	handlePathCreated,
	handleResize,
	initializeFabric,
	renderCanvas,
} from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { ActiveElement } from "@/types/type";
import { LeftSidebar } from "./_components/LeftSidebar";
import Navbar from "./_components/Navbar";
import { RightSidebar } from "./_components/RightSidebar";

const HomePage = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);
	const isDrawing = useRef(false);
	const shapeRef = useRef<fabric.Object | null>(null);
	const selectedShapeRef = useRef<string | null>(null);
	const activeObjectRef = useRef<fabric.Object | null>(null);

	const imageInputRef = useRef<HTMLInputElement>(null);

	const isEditingRef = useRef(false);

	const [activeElement, setActiveElement] = useState<ActiveElement>({
		name: "",
		value: "",
		icon: "",
	});
	const [elementAttributes, setElementAttributes] = useState({
		width: "",
		height: "",
		fontSize: "",
		fontFamily: "",
		fontWeight: "",
		fill: "#aabbcc",
		stroke: "#aabbcc",
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
		canvas.on("selection:created", (options: any) => {
			handleCanvasSelectionCreated({
				options,
				isEditingRef,
				setElementAttributes,
			});
		});
		canvas.on("object:scaling", (options) => {
			handleCanvasObjectScaling({
				options,
				setElementAttributes,
			});
		});
		canvas.on("path:created", (options: any) => {
			handlePathCreated({ options, syncShapeInStorage });
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

				<Live canvasRef={canvasRef} undo={undo} redo={redo} />

				<RightSidebar
					elementAttributes={elementAttributes}
					setElementAttributes={setElementAttributes}
					fabricRef={fabricRef}
					isEditingRef={isEditingRef}
					activeObjectRef={activeObjectRef}
					syncShapeInStorage={syncShapeInStorage}
				/>
			</section>
		</main>
	);
};

export default HomePage;
