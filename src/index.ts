import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { initDB } from './config/database';
import { orderRoutes } from './routes/orderRoutes';
import './workers/orderWorker';

const server = Fastify({
  logger: true // This enables the built-in logger (good for debugging)
});

server.register(websocket);
server.register(orderRoutes);

server.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Order Execution Engine Running' };
});

const start = async () => {
  try {
    await initDB();
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server started on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();