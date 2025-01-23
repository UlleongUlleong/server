import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const logger = new Logger(RedisModule.name);
        const redis = new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASS,
          db: Number(process.env.REDIS_DB),
        });

        redis.on('error', (err) =>
          logger.error('Redis client error: ', err.message),
        );
        redis.on('connect', () => logger.log('Redis client is connected.'));

        return redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
