import { Controller, Post, Body, Get, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dtos/check-email.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { UserWithProfile } from './interfaces/user-with-profile.interface';
import { CreateUserDto } from './dtos/create-user.dto';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Response } from 'express';
import { UserInfo } from './interfaces/userInfo.inerface';
import { VerifyCodeDto } from './dtos/verify-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LocalLoginDto,
    @Res() res: Response,
  ): Promise<Response<UserInfo>> {
    const {
      accessToken,
      userInfo,
    }: { accessToken: string; userInfo: UserInfo } =
      await this.authService.login(loginDto);
    res.header('Authorization', `Bearer ${accessToken}`);
    return res.status(200).json({
      status: 'success',
      data: userInfo,
      message: '로그인 성공',
    });
  }

  @Post('login/activate')
  async activateAccount(
    @Body() loginDto: LocalLoginDto,
    @Res() res: Response,
  ): Promise<Response<UserInfo>> {
    await this.authService.activateAccount(loginDto);
    const {
      accessToken,
      userInfo,
    }: { accessToken: string; userInfo: UserInfo } =
      await this.authService.login(loginDto);
    res.header('Authorization', `Bearer ${accessToken}`);
    return res.status(200).json({
      status: 'success',
      data: userInfo,
      message: '계정 활성화 성공',
    });
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback() {}

  @Get('/naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin(): Promise<void> {}

  @Get('/naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback() {}

  @Get('/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(): Promise<void> {}

  @Get('/kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback() {}

  @Post('/check-email')
  async emailCheck(
    @Body() checkEmailDto: CheckEmailDto,
  ): Promise<ApiResponse<null>> {
    const isDuplicated =
      await this.authService.checkEmailDuplicate(checkEmailDto);

    return {
      status: 'success',
      data: null,
      message: isDuplicated
        ? '중복된 이메일입니다.'
        : '사용가능한 이메일입니다.',
    };
  }

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.sendVerificationCodeToUser(createUserDto);

    return {
      status: 'success',
      data: null,
      message: '인증코드가 메일로 발송되었습니다.',
    };
  }

  @Post('verify-code')
  async verifyCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<ApiResponse<UserWithProfile>> {
    const user = await this.authService.registerEmailUser(verifyCodeDto);

    return {
      status: 'success',
      data: user,
      message: '인증이 완료되었습니다.',
    };
  }
}
