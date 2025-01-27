import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailModule } from '../mail/mail.module';
import { CategoryModule } from '../category/category.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../auth/token.service';
import { S3Module } from 'src/common/modules/s3/s3.module';

@Module({
  imports: [
    MailModule,
    CategoryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
    S3Module,
  ],
  providers: [UserService, TokenService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
