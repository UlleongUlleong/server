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
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { EmailDto } from '../mail/dtos/email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';
import { ProfileDetail } from './interfaces/profile.interface';
import { SkipStatusCheck } from 'src/common/decorators/skip-status-check.decorator';
import { QueryAlcoholDto } from './dtos/query.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me/profile')
  @SkipStatusCheck()
  @UseGuards(JwtAuthGuard)
  async getUserProfile(
    @Req() req: AuthenticateRequest,
  ): Promise<ApiResponse<ProfileDetail>> {
    const id: number = req.user.sub;
    const profile = await this.userService.findProfileWithRelation(id);
    return {
      status: 'success',
      data: profile,
      message: '내 프로필을 가져왔습니다.',
    };
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateUserProfile(
    @Req() req: AuthenticateRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse<null>> {
    const id: number = req.user.sub;
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

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  @SkipStatusCheck()
  async disableUser(
    @Req() req: AuthenticateRequest,
  ): Promise<ApiResponse<null>> {
    const id: number = req.user.sub;
    const isActive = await this.userService.updateUserStatus(id);

    return {
      status: 'success',
      data: null,
      message: isActive
        ? '계정이 활성화되었습니다.'
        : '계정이 비활성화되었습니다.',
    };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Req() req: AuthenticateRequest,
  ): Promise<ApiResponse<null>> {
    const id: number = req.user.sub;
    await this.userService.deleteUser(id);

    return {
      status: 'success',
      data: null,
      message: '계정이 삭제되었습니다.',
    };
  }

  @Get('interest')
  @UseGuards(JwtAuthGuard)
  async getInterest(
    @Req() req: AuthenticateRequest,
    @Query() query: QueryAlcoholDto,
  ): Promise<ApiResponse<any>> {
    const id: number = req.user.sub;
    const { alcoholInfoDtos, meta } = await this.userService.findInterest(
      id,
      query,
    );
    return {
      status: 'success',
      data: alcoholInfoDtos,
      meta: meta,
      message: '관심있는 술 조회',
    };
  }

  @Get('reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReview(
    @Req() req: AuthenticateRequest,
    @Query() query: QueryAlcoholDto,
  ): Promise<ApiResponse<any>> {
    const id: number = req.user.sub;
    const myReviewInfo = await this.userService.findMyReview(id, query);
    return {
      status: 'success',
      data: myReviewInfo,
      message: '댓글 단 술 조회',
    };
  }
}
