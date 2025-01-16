import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async checkThemeIdsExist(ids: number[]) {
    const count = await this.prisma.chatRoomTheme.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new BadRequestException('술 카테고리의 값이 유효하지 않습니다.');
    }
  }
}
