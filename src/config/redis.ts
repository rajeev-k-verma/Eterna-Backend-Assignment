import IORedis from 'ioredis';

const REDIS_CONNECTION = {
  host: 'localhost', 
  port: 6379,
  maxRetriesPerRequest: null // Required requirement for BullMQ
};

export const connection = new IORedis(REDIS_CONNECTION);