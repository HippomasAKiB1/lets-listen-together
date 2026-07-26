import { io, Socket } from "socket.io-client";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://tunetogether-backend.onrender.com";

let socket: Socket | null = null;

export function getSocket(token: string, roomId: string): Socket {
  if (socket) {
    const currentQuery = (socket.io.opts as any)?.query;
    const currentAuth = (socket.io.opts as any)?.auth;
    if (socket.connected && currentQuery?.room_id === roomId && currentAuth?.token === token) {
      return socket;
    }
    socket.disconnect();
    socket = null;
  }

  socket = io(BACKEND_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    query: { room_id: roomId, token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocketInstance(): Socket | null {
  return socket;
}
