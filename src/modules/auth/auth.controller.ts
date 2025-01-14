import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { EmailDto } from '../user/dtos/email.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Response } from 'express';
import { UserInfo } from './interfaces/user-info.interface.ts';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { AuthenticateRequest } from './interfaces/authenticate-request.interface';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: AuthenticateRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user: UserPayload = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    const refreshToken = await this.authService.createRefreshToken(user);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONT_URL);
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin(): Promise<void> {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback(
    @Req() req: AuthenticateRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user: UserPayload = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    const refreshToken = await this.authService.createRefreshToken(user);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONT_URL);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(): Promise<void> {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(
    @Req() req: AuthenticateRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user: UserPayload = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    const refreshToken = await this.authService.createRefreshToken(user);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONT_URL);
  }

  @Post('email-codes')
  async sendEmailCode(@Body() emailDto: EmailDto): Promise<ApiResponse<null>> {
    await this.authService.sendEmailCode(emailDto);

    return {
      status: 'success',
      data: null,
      message: '인증코드가 메일로 발송되었습니다.',
    };
  }

  @Post('email-codes/verification')
  async verifyEmailCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.verifyEmailCode(verifyCodeDto);

    return {
      status: 'success',
      data: null,
      message: '인증이 완료되었습니다.',
    };
  }
}
