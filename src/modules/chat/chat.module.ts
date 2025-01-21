import { Module } from '@nestjs/common';
import { CategoryModule } from '../category/category.module';
import { CategoryService } from '../category/category.service';
import { ChatService } from './chat.service';
import { ThemeService } from './theme.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    CategoryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
    UserModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ChatController],
  providers: [CategoryService, ChatService, ThemeService, ChatGateway],
})
export class ChatModule {}
