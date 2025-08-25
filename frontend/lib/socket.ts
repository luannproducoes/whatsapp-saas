import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (!socket) {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    socket = io(baseURL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};