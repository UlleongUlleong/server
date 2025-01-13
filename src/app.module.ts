import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './common/modules/prisma.module';
import { RedisModule } from './common/modules/redis.module';
import { CategoryModule } from './modules/category/category.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    PrismaModule,
    RedisModule,
    CategoryModule,
  ],
})
export class AppModule {}
