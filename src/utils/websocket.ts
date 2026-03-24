import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

export const getSocketIO = (): SocketIOServer | null => {
  return io;
};

export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};