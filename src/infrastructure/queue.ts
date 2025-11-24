import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const ORDER_QUEUE_NAME = 'order-execution-queue';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential', // Wait longer between each retry (1s, 2s, 4s...)
      delay: 1000, 
    },
    removeOnComplete: true, // Auto-delete job from Redis after success (saves RAM)
    removeOnFail: false // Keep failed jobs so we can inspect them
  }
});