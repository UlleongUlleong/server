import {
  Controller,
  Get,
  UseGuards,
  Put,
  Req,
  Body,
  Query,
  Post,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { EmailDto } from './dtos/email.dto';
import { CategoryDto } from './dtos/category.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ResponseProfileDto } from './dtos/responseProfile.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

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

  @Get('email/availability')
  async checkEmailExists(
    @Query() emailDto: EmailDto,
  ): Promise<ApiResponse<null>> {
    await this.userService.checkEmailDuplication(emailDto);

    return {
      status: 'success',
      data: null,
      message: '사용가능한 이메일입니다.',
    };
  }

  @Get('nickname/availability')
  async checkNicknameExists(
    @Query() nicknameDto: NicknameDto,
  ): Promise<ApiResponse<null>> {
    await this.userService.checkNicknameDuplication(nicknameDto);

    return {
      status: 'success',
      data: null,
      message: '사용가능한 닉네임입니다.',
    };
  }

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<null>> {
    await this.userService.createEmailUser(createUserDto);

    return {
      status: 'success',
      data: null,
      message: '회원가입이 완료되었습니다.',
    };
  }

  @Patch('disable')
  async disableUser(
    @Req() req: AuthenticateRequest,
  ): Promise<ApiResponse<null>> {
    await this.userService.disableUser(req.user.id);
    return {
      status: 'success',
      data: null,
      message: '계정이 비활성화 되었습니다.',
    };
  }
}
