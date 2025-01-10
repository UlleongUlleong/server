import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { PrismaService } from '../../prisma.service';
import { UsersController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService, PrismaService],
  controllers: [UsersController],
})
export class UsersModule {}
