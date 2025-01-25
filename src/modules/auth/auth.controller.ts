import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { EmailDto } from '../mail/dtos/email.dto';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Request, Response } from 'express';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';
import { AuthenticateRequest } from './interfaces/authenticate-request.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePasswordDto } from '../user/dtos/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LocalLoginDto,
    @Res() res: Response,
  ): Promise<Response<null>> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.status(200).json({
      status: 'success',
      data: null,
      message: '로그인 성공',
    });
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<null>> {
    const token = req.cookies['refresh_token'];
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(token);
    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.status(201).json({
      status: 'success',
      data: null,
      message: '토큰 재발급',
    });
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: AuthenticateRequest,
    @Res() res: Response,
  ): Promise<void> {
    const id: number = req.user.sub;
    const accessToken = await this.authService.createAccessToken(id);
    const refreshToken = await this.authService.createRefreshToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONTEND_ORIGIN);
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
    const id: number = req.user.sub;
    const accessToken = await this.authService.createAccessToken(id);
    const refreshToken = await this.authService.createRefreshToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONTEND_ORIGIN);
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
    const id: number = req.user.sub;
    const accessToken = await this.authService.createAccessToken(id);
    const refreshToken = await this.authService.createRefreshToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });

    return res.redirect(process.env.FRONTEND_ORIGIN);
  }

  @Post('email-codes')
  async sendEmailCode(@Body() emailDto: EmailDto): Promise<HttpContent<null>> {
    await this.authService.sendEmailCode(emailDto);

    return {
      data: null,
      message: '인증코드가 메일로 발송되었습니다.',
    };
  }

  @Post('email-codes/verification')
  async verifyEmailCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<HttpContent<null>> {
    await this.authService.verifyEmailCode(verifyCodeDto);

    return {
      data: null,
      message: '인증이 완료되었습니다.',
    };
  }

  @Post('email-password')
  async sendTemporaryPassword(
    @Body() emailDto: EmailDto,
  ): Promise<CustomResponse<null>> {
    console.log(emailDto);
    await this.authService.sendTemporaryPassword(emailDto);

    return {
      data: null,
      message: '임시 비밀번호가 발송되었습니다',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async updatePassword(
    @Req() req: AuthenticateRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<CustomResponse<null>> {
    const id: number = req.user.sub;
    await this.authService.resetPassword(id, updatePasswordDto);
    return {
      data: null,
      message: '비밀번호가 변경되었습니다.',
    };
  }
}
