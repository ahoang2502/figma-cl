import React, { useCallback } from "react";

import { LiveCursors } from "./cursor/LiveCursors";
import { useMyPresence, useOthers } from "@/liveblocks.config";

export const Live = () => {
	const others = useOthers();

	const [{ cursor }, updateMyPresence] = useMyPresence() as any;

	// useCallback - doesn't recreate the function every time
	const handlerPointerMove = useCallback((event: React.PointerEvent) => {
		event.preventDefault();

		const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
		const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

		updateMyPresence({
			cursor: { x, y },
		});
	}, []);

	const handlerPointerLeave = useCallback((event: React.PointerEvent) => {
		event.preventDefault();

		updateMyPresence({
			cursor: null,
			message: null,
		});
	}, []);

	const handlerPointerDown = useCallback((event: React.PointerEvent) => {
		const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
		const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

		updateMyPresence({
			cursor: null,
			message: null,
		});
	}, []);

	return (
		<div
			onPointerMove={handlerPointerMove}
			onPointerLeave={handlerPointerLeave}
			onPointerDown={handlerPointerDown}
			className="h-[100vh] w-full flex justify-center items-center text-center"
		>
			<h1 className="text-white text-2xl">Liveblocks Figma Clone</h1>

			<LiveCursors others={others} />
		</div>
	);
};
