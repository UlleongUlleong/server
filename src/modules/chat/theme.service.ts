import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async checkThemeIdExist(id: number) {
    const count = await this.prisma.chatRoomTheme.count({
      where: { id },
    });

    if (count < 1) {
      throw new BadRequestException('채팅방 테마 ID의 값이 유효하지 않습니다.');
    }
  }
}
