import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './common/modules/prisma.module';
import { RedisModule } from './common/modules/redis.module';
import { CategoryModule } from './modules/category/category.module';
import { AlcoholModule } from './modules/alcohol/alcohol.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    PrismaModule,
    RedisModule,
    CategoryModule,
    AlcoholModule,
  ],
})
export class AppModule {}
