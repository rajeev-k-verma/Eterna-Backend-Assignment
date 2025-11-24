import { FastifyInstance } from 'fastify';
import { orderQueue, queueEvents } from '../infrastructure/queue';
import { Order } from '../domain/mockDexRouter';

export async function orderRoutes(fastify: FastifyInstance) {
  
  // 1. POST Endpoint: Submit an Order
  fastify.post('/orders/execute', async (request, reply) => {
    const orderData = request.body as any;

    const orderId = `order-${Date.now()}`;
    
    const order: Order = {
      orderId,
      type: 'market',
      side: orderData.side || 'buy',
      amount: orderData.amount || 1,
      tokenIn: orderData.tokenIn || 'SOL',
      tokenOut: orderData.tokenOut || 'USDC'
    };

    // Add to the Queue
    await orderQueue.add('execute-order', order, { jobId: orderId });

    return { 
      status: 'queued', 
      orderId,
      message: 'Order received and processing started.' 
    };
  });

  // 2. WebSocket Endpoint: Live Updates
  fastify.get('/ws/orders', { websocket: true }, (socket, req: any) => {
    try {
      // Fix: Parse query properly
      const query = req.query as Record<string, string>;
      const orderId = query.orderId || Object.keys(query)[0]; // Fallback to first key
      
      if (!orderId) {
        socket.send(JSON.stringify({ error: 'Missing orderId query parameter' }));
        socket.close();
        return;
      }

      console.log(`[WebSocket] Client connected for order: ${orderId}`);

      // Send initial connection confirmation
      socket.send(JSON.stringify({ 
        status: 'connected', 
        orderId,
        message: 'Listening for updates...' 
      }));

      // Listener 1: Progress Updates
      const progressHandler = async ({ jobId, data }: { jobId: string; data: number | object | string | boolean }) => {
        try {
          if (jobId === orderId) {
            let status = 'pending';
            if (typeof data === 'number') {
                if (data === 10) status = 'routing';
                if (data === 50) status = 'submitted';
                if (data === 100) status = 'confirming';
            }
            
            socket.send(JSON.stringify({ orderId, status, progress: data }));
          }
        } catch (err) {
          console.error(`[WebSocket] Progress handler error:`, err);
        }
      };

      // Listener 2: Completion
      const completedHandler = async ({ jobId, returnvalue }: { jobId: string; returnvalue: any }) => {
        try {
          if (jobId === orderId) {
            socket.send(JSON.stringify({ 
              orderId, 
              status: 'confirmed', 
              txHash: returnvalue.txHash,
              price: returnvalue.executedPrice 
            }));
            // Close connection after successful completion
            setTimeout(() => socket.close(), 500);
          }
        } catch (err) {
          console.error(`[WebSocket] Completed handler error:`, err);
        }
      };

      // Listener 3: Failure
      const failedHandler = async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
        try {
          if (jobId === orderId) {
            socket.send(JSON.stringify({ orderId, status: 'failed', error: failedReason }));
            // Close connection after failure
            setTimeout(() => socket.close(), 500);
          }
        } catch (err) {
          console.error(`[WebSocket] Failed handler error:`, err);
        }
      };

      // Attach the listeners to BullMQ
      queueEvents.on('progress', progressHandler);
      queueEvents.on('completed', completedHandler);
      queueEvents.on('failed', failedHandler);

      // Error handler
      socket.on('error', (err) => {
        console.error(`[WebSocket] Socket error for ${orderId}:`, err);
      });

      socket.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${orderId}`);
        queueEvents.off('progress', progressHandler);
        queueEvents.off('completed', completedHandler);
        queueEvents.off('failed', failedHandler);
      });
      
    } catch (err) {
      console.error(`[WebSocket] Initialization error:`, err);
      socket.close();
    }
  });
}