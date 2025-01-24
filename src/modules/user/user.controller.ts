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
import { CustomResponse } from '../../common/interfaces/api-response.interface';
import { EmailDto } from '../mail/dtos/email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';
import { ProfileDetail } from './interfaces/profile.interface';
import { SkipStatusCheck } from 'src/common/decorators/skip-status-check.decorator';
import { QueryAlcoholDto } from './dtos/query.dto';
import { Review } from '../alcohol/inerfaces/review.interface';
import { AlcoholSummary } from './interfaces/alcohol-summary.interface';
import { UpdatePasswordDto } from './dtos/update-password.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me/profile')
  @SkipStatusCheck()
  @UseGuards(JwtAuthGuard)
  async getUserProfile(
    @Req() req: AuthenticateRequest,
  ): Promise<CustomResponse<ProfileDetail>> {
    const id: number = req.user.sub;
    const profile = await this.userService.findProfileWithRelation(id);
    return {
      data: profile,
      message: '내 프로필을 가져왔습니다.',
    };
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateUserProfile(
    @Req() req: AuthenticateRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<CustomResponse<null>> {
    const id: number = req.user.sub;
    await this.userService.updateUserProfile(id, updateProfileDto);

    return {
      data: null,
    };
  }

  @Get('email/availability')
  async checkEmailExists(
    @Query() emailDto: EmailDto,
  ): Promise<CustomResponse<null>> {
    await this.userService.checkEmailDuplication(emailDto);

    return {
      data: null,
      message: '사용가능한 이메일입니다.',
    };
  }

  @Get('nickname/availability')
  async checkNicknameExists(
    @Query() nicknameDto: NicknameDto,
  ): Promise<CustomResponse<null>> {
    await this.userService.checkNicknameDuplication(nicknameDto);

    return {
      data: null,
      message: '사용가능한 닉네임입니다.',
    };
  }

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CustomResponse<null>> {
    await this.userService.createEmailUser(createUserDto);

    return {
      data: null,
      message: '회원가입이 완료되었습니다.',
    };
  }

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  @SkipStatusCheck()
  async disableUser(
    @Req() req: AuthenticateRequest,
  ): Promise<CustomResponse<null>> {
    const id: number = req.user.sub;
    const isActive = await this.userService.updateUserStatus(id);

    return {
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
  ): Promise<CustomResponse<null>> {
    const id: number = req.user.sub;
    await this.userService.deleteUser(id);

    return {
      data: null,
      message: '계정이 삭제되었습니다.',
    };
  }

  @Get('interest')
  @UseGuards(JwtAuthGuard)
  async getInterest(
    @Req() req: AuthenticateRequest,
    @Query() query: QueryAlcoholDto,
  ): Promise<CustomResponse<AlcoholSummary[]>> {
    const id: number = req.user.sub;
    const { alcoholInfo, pagination } = await this.userService.findInterest(
      id,
      query,
    );
    return {
      data: alcoholInfo,
      pagination,
    };
  }

  @Get('reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReview(
    @Req() req: AuthenticateRequest,
    @Query() query: QueryAlcoholDto,
  ): Promise<CustomResponse<Review[]>> {
    const id: number = req.user.sub;
    const { myReviewInfo, pagination } = await this.userService.findMyReview(
      id,
      query,
    );
    return {
      data: myReviewInfo,
      pagination,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('password/update')
  async updatePassword(
    @Req() req: AuthenticateRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<CustomResponse<null>> {
    const id: number = req.user.sub;
    await this.userService.updatePassword(id, updatePasswordDto);
    return {
      data: null,
      message: '비밀번호가 변경되었습니다.',
    };
  }
}
