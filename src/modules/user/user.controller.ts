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
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';
import { ProfileDetail } from './interfaces/profile.interface';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  async getUserProfile(
    @Req() req: AuthenticateRequest,
  ): Promise<ApiResponse<ProfileDetail>> {
    const { id } = req.user;
    const profile = await this.userService.findProfileWithRelation(id);
    return {
      status: 'success',
      data: profile,
      message: '내 프로필을 가져왔습니다.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  async updateUserProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse<ProfileDetail>> {
    const { id } = req.user;
    await this.userService.updateUserProfile(id, updateProfileDto);

    return {
      status: 'success',
      data: null,
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
      message: '계정이 비활성화되었습니다.',
    };
  }
}
