"use client";

import React from "react";

import { RoomProvider } from "../../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";
import Loader from "@/components/Loader";

export const Room = ({ children }: { children: React.ReactNode }) => {
	return (
		<RoomProvider
			id="my-room"
			initialPresence={{ cursor: null, cursorColor: null, editingText: null }}
			initialStorage={{
				canvasObjects: new LiveMap(),
			}}
		>
			<ClientSideSuspense fallback={<Loader />}>
				{() => children}
			</ClientSideSuspense>
		</RoomProvider>
	);
};
