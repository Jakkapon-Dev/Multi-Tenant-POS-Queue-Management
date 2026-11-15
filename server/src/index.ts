import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import menuRoutes from './routes/menu.routes.js';
import tableRoutes from './routes/table.routes.js';
import orderRoutes from './routes/order.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { setupSocketHandlers } from './sockets/orderSocket.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Setup Real-time Event Handlers
setupSocketHandlers(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'OmniPOS API Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  const host = process.env.NODE_ENV === 'development' && process.env.DEMO_MODE === 'true'
    ? 'localhost'
    : undefined;
  server.listen(Number(PORT), host, () => {
    console.log(`🚀 [POS Server] Ready on http://localhost:${PORT}`);
  });
}

export { app, server, io };
