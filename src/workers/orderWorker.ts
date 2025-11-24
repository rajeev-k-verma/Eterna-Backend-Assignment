import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { ORDER_QUEUE_NAME } from '../infrastructure/queue';
import { MockDexRouter, Order } from '../domain/mockDexRouter';
import { saveOrder } from '../config/database';

const router = new MockDexRouter();

const processOrder = async (job: Job<Order>) => {
  const order = job.data;
  console.log(`[Worker] Processing Order ID: ${order.orderId}`);

  try {
    // Step 1: Update Status to "Routing"
    await job.updateProgress(10); 
    console.log(`[Status] Order ${order.orderId}: ROUTING`);

    // Step 2: Get the best quote
    const quote = await router.routeAndGetQuote(order.tokenIn, order.tokenOut, order.amount);
    
    // Step 3: Update Status to "Building/Submitting"
    await job.updateProgress(50);
    console.log(`[Status] Order ${order.orderId}: SUBMITTED to ${quote.dex}`);

    // Step 4: Execute the swap
    const result = await router.executeSwap(quote, order.orderId);

    // Step 5: Update Status to "Confirmed"
    await job.updateProgress(100);

    await saveOrder(order, result, 'confirmed');
    console.log(`[Status] Order ${order.orderId}: CONFIRMED. TxHash: ${result.txHash}`);
    
    return result;

  } catch (error: any) {
    console.error(`[Worker] Failed order ${order.orderId}:`, error);
    await saveOrder(order, null, 'failed', error.message);
    throw error;
  }
};

export const orderWorker = new Worker(ORDER_QUEUE_NAME, processOrder, {
  connection,
  concurrency: 10, // Process 10 orders at the same time 
  limiter: {
    max: 100,      // Max 100 jobs
    duration: 60000 // Per 60 seconds (1 minute)
  }
});

// Event listeners for logging
orderWorker.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} completed successfully!`);
});

orderWorker.on('failed', (job, err) => {
  console.log(`[Queue] Job ${job?.id} has failed with ${err.message}`);
});