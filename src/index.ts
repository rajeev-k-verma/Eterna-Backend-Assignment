import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { MockDexRouter } from './domain/mockDexRouter';

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

const runTest = async () => {
    const router = new MockDexRouter();
    console.log("--- STARTING MOCK ROUTER TEST ---");
    const bestQuote = await router.routeAndGetQuote("SOL", "USDC", 1);
    const result = await router.executeSwap(bestQuote, "order-123");
    console.log("Swap Result:", result);
    console.log("--- TEST COMPLETE ---");
}

// Call it before starting the server
runTest();

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