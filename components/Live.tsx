import React, { useCallback, useEffect, useState } from "react";

import { shortcuts } from "@/constants";
import useInterval from "@/hooks/useInterval";
import {
	useBroadcastEvent,
	useEventListener,
	useMyPresence,
} from "@/liveblocks.config";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import { Comments } from "./comments/Comments";
import { CursorChat } from "./cursor/CursorChat";
import { LiveCursors } from "./cursor/LiveCursors";
import { FlyingReaction } from "./reaction/FlyingReaction";
import { ReactionSelector } from "./reaction/ReactionButton";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";

interface LiveProps {
	canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
	undo: () => void;
	redo: () => void;
}

export const Live = ({ canvasRef, undo, redo }: LiveProps) => {
	const [cursorState, setCursorState] = useState<CursorState>({
		mode: CursorMode.Hidden,
	});
	const [reaction, setReaction] = useState<Reaction[]>([]);

	const broadcast = useBroadcastEvent();

	const [{ cursor }, updateMyPresence] = useMyPresence();

	// useCallback - doesn't recreate the function every time
	const handlerPointerMove = useCallback((event: React.PointerEvent) => {
		event.preventDefault();

		if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
			const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({
				cursor: { x, y },
			});
		}
	}, []);

	const handlerPointerLeave = useCallback((event: React.PointerEvent) => {
		setCursorState({ mode: CursorMode.Hidden });

		updateMyPresence({
			cursor: null,
			message: null,
		});
	}, []);

	const handlerPointerDown = useCallback(
		(event: React.PointerEvent) => {
			const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({
				cursor: null,
				message: null,
			});

			setCursorState((state: CursorState) =>
				cursorState.mode === CursorMode.Reaction
					? { ...state, isPressed: true }
					: state
			);
		},
		[cursorState.mode, setCursorState]
	);

	const handlePointerUp = useCallback(
		(event: React.PointerEvent) => {
			setCursorState((state: CursorState) =>
				cursorState.mode === CursorMode.Reaction
					? { ...state, isPressed: true }
					: state
			);
		},
		[cursorState.mode, setCursorState]
	);

	useEffect(() => {
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === "/")
				setCursorState({
					mode: CursorMode.Chat,
					previousMessage: null,
					message: "",
				});
			else if (e.key === "Escape") {
				updateMyPresence({ message: "" });
				setCursorState({
					mode: CursorMode.Hidden,
				});
			} else if (e.key === "e") {
				setCursorState({
					mode: CursorMode.ReactionSelector,
				});
			}
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "/") {
				e.preventDefault();
			}
		};

		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [updateMyPresence]);

	const setReactions = useCallback((reaction: string) => {
		setCursorState({
			mode: CursorMode.Reaction,
			reaction,
			isPressed: false,
		});
	}, []);

	useInterval(() => {
		setReaction((reaction) =>
			reaction.filter((r) => r.timestamp > Date.now() - 4000)
		);
	}, 1000);

	useInterval(() => {
		if (
			cursorState.mode === CursorMode.Reaction &&
			cursorState.isPressed &&
			cursor
		) {
			setReaction((reactions) =>
				reactions.concat([
					{
						point: { x: cursor.x, y: cursor.y },
						value: cursorState.reaction,
						timestamp: Date.now(),
					},
				])
			);

			broadcast({
				x: cursor.x,
				y: cursor.y,
				value: cursorState.reaction,
			});
		}
	}, 100);

	useEventListener((eventData) => {
		const event = eventData.event;

		setReaction((reactions) =>
			reactions.concat([
				{
					point: { x: event.x, y: event.y },
					value: event.value,
					timestamp: Date.now(),
				},
			])
		);
	});

	const handleContextMenuClick = useCallback((key: string) => {
		switch (key) {
			case "Chat":
				setCursorState({
					mode: CursorMode.Chat,
					previousMessage: null,
					message: "",
				});
				break;

			case "Undo":
				undo();
				break;

			case "Redo":
				redo();
				break;

			case "Reaction":
				setCursorState({
					mode: CursorMode.ReactionSelector,
				});
				break;

			default:
				break;
		}
	}, []);

	return (
		<ContextMenu>
			<ContextMenuTrigger
				id="canvas"
				onPointerMove={handlerPointerMove}
				onPointerLeave={handlerPointerLeave}
				onPointerDown={handlerPointerDown}
				onPointerUp={handlePointerUp}
				className="relative h-full w-full flex flex-1 justify-center items-center text-center"
			>
				<canvas ref={canvasRef} />

				{reaction.map((r) => (
					<FlyingReaction
						key={r.timestamp.toString()}
						x={r.point.x}
						y={r.point.y}
						timestamp={r.timestamp}
						value={r.value}
					/>
				))}

				{cursor && (
					<CursorChat
						cursor={cursor}
						cursorState={cursorState}
						setCursorState={setCursorState}
						updateMyPresence={updateMyPresence}
					/>
				)}

				{cursorState.mode === CursorMode.ReactionSelector && (
					<ReactionSelector setReaction={setReactions} />
				)}

				<LiveCursors  />

				<Comments />
			</ContextMenuTrigger>

			<ContextMenuContent className="right-menu-content">
				{shortcuts.map((item) => (
					<ContextMenuItem
						key={item.key}
						onClick={() => handleContextMenuClick(item.name)}
						className="right-menu-item"
					>
						<p>{item.name}</p>

						<p className="text-xs text-primary-grey-300">{item.shortcut}</p>
					</ContextMenuItem>
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
};
