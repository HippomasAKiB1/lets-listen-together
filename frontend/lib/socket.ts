import { io, Socket } from "socket.io-client";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(token: string, roomId: string): Socket {
  if (socket?.connected) {
    return socket;
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
