import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to OmniPOS Real-time Socket Server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from OmniPOS Socket Server');
    });
  }
  return socket;
};

export const joinTenantRoom = (tenantId: string) => {
  const s = getSocket();
  s.emit('join:tenant', tenantId);
};

export const joinOrderRoom = (orderId: string) => {
  const s = getSocket();
  s.emit('join:order', orderId);
};
