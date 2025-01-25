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
import { EmailDto } from '../mail/dtos/email.dto';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Response } from 'express';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';
import { AuthenticateRequest } from './interfaces/authenticate-request.interface';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LocalLoginDto,
    @Res() res: Response,
  ): Promise<Response<null>> {
    const accessToken = await this.authService.login(loginDto);

    res.header('Authorization', `Bearer ${accessToken}`);
    return res.status(200).json({
      status: 'success',
      data: null,
      message: '로그인 성공',
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
    const id: number = req.user.id;
    const accessToken = await this.tokenService.createAccessToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
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
    const id: number = req.user.id;
    const accessToken = await this.tokenService.createAccessToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
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
    const id: number = req.user.id;
    const accessToken = await this.tokenService.createAccessToken(id);

    res.header('Authorization', `Bearer ${accessToken}`);
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
  ): Promise<HttpContent<null>> {
    await this.authService.sendTemporaryPassword(emailDto);

    return {
      data: null,
      message: '임시 비밀번호가 발송되었습니다',
    };
  }
}
