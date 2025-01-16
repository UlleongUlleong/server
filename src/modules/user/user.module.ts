import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailModule } from '../mail/mail.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [MailModule, CategoryModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
