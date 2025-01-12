import { Controller, Get, UseGuards, Put, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './user.service';
import { ResponseProfileDto } from './dtos/responseProfile.dto';
import { CategoryDto } from './dtos/category.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserCategory(@Req() req): Promise<ApiResponse<ResponseProfileDto>> {
    const { userId } = req.user;
    const userProfile = await this.userService.findUserProfile(userId);
    return {
      status: 'success',
      data: userProfile,
      message: '프로필 조회',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateUserCategory(
    @Req() req,
    @Body() categoryDto: CategoryDto,
  ): Promise<ApiResponse<ResponseProfileDto>> {
    const { userId } = req.user;
    const userProfile = await this.userService.updateUserProfile(
      userId,
      categoryDto,
    );
    return {
      status: 'success',
      data: userProfile,
      message: '프로필 수정',
    };
  }
}
