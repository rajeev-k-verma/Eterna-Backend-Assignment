import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { orderQueue } from './infrastructure/queue';
import './workers/orderWorker';

const server = Fastify({
  logger: true // This enables the built-in logger (good for debugging)
});

server.register(websocket);

server.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Order Execution Engine Running' };
});

server.get('/ws', { websocket: true }, (connection, req) => {
  connection.socket.on('message', (message: any) => {
    connection.socket.send(`You said: ${message.toString()}`);
  });
});

// TEMPORARY: A test route to trigger the queue manually
server.get('/test-queue', async () => {
  const mockOrder = {
    orderId: `order-${Date.now()}`,
    type: 'market',
    side: 'buy',
    amount: 5,
    tokenIn: 'SOL',
    tokenOut: 'USDC'
  };
  
  // Add to Queue
  await orderQueue.add('execute-order', mockOrder);
  return { status: 'queued', orderId: mockOrder.orderId };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server started on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();