"use client";

import React from "react";

import { RoomProvider } from "../../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";

export const Room = ({ children }: { children: React.ReactNode }) => {
	return (
		<RoomProvider id="my-room" initialPresence={{}}>
			<ClientSideSuspense fallback={<div>Loading...</div>}>
				{() => children}
			</ClientSideSuspense>
		</RoomProvider>
	);
};
