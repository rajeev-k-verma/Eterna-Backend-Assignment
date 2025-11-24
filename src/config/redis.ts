import IORedis from 'ioredis';

export const connection = process.env.REDIS_URL 
? new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined
  })
: new IORedis({
    host: 'localhost', 
    port: 6379,
    maxRetriesPerRequest: null
  });
