import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './common/modules/redis/redis.module';
import { CategoryModule } from './modules/category/category.module';
import { AlcoholModule } from './modules/alcohol/alcohol.module';
import { PrismaModule } from './common/modules/prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';

import { ChatModule } from './modules/chat/chat.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    MailModule,
    ChatModule,
    PrismaModule,
    RedisModule,
    CategoryModule,
    AlcoholModule,
  ],
})
export class AppModule {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      Logger.overrideLogger(['warn', 'error']);
    } else {
      Logger.overrideLogger(['log', 'debug', 'warn', 'error']);
    }
  }
}
