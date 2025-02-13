import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { EmailDto } from '../mail/dtos/email.dto';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Request, Response } from 'express';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';
import { AuthenticateRequest } from './interfaces/authenticate-request.interface';
import { TokenService } from './token.service';
import { checkNodeEnvIsProduction } from 'src/common/utils/environment.util';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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
    @Req() req: Request,
  ): Promise<void> {
    const accessToken = await this.authService.login(loginDto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: checkNodeEnvIsProduction() ? 'strict' : 'none',
      domain: checkNodeEnvIsProduction() ? '.sulleong.coderoom.site' : null,
      maxAge: loginDto.isRemembered ? 604799000 : null,
    });

    res.json({
      statusCode: 200,
      message: '로그인 되었습니다.',
      data: null,
      path: req.url,
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
    await this.tokenService.createRefreshToken(id, accessToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: checkNodeEnvIsProduction() ? 'strict' : 'none',
      domain: checkNodeEnvIsProduction() ? '.sulleong.coderoom.site' : null,
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
    const id: number = req.user.id;
    const accessToken = await this.tokenService.createAccessToken(id);
    await this.tokenService.createRefreshToken(id, accessToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: checkNodeEnvIsProduction() ? 'strict' : 'none',
      domain: checkNodeEnvIsProduction() ? '.sulleong.coderoom.site' : null,
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
    const id: number = req.user.id;
    const accessToken = await this.tokenService.createAccessToken(id);
    await this.tokenService.createRefreshToken(id, accessToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: checkNodeEnvIsProduction() ? 'strict' : 'none',
      domain: checkNodeEnvIsProduction() ? '.sulleong.coderoom.site' : null,
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
  ): Promise<HttpContent<null>> {
    await this.authService.sendTemporaryPassword(emailDto);

    return {
      data: null,
      message: '임시 비밀번호가 발송되었습니다',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  async logout(
    @Req() req: AuthenticateRequest,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.cookies['access_token'];
    await this.authService.logout(token);

    res.cookie('access_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: checkNodeEnvIsProduction() ? 'strict' : 'none',
      domain: checkNodeEnvIsProduction() ? '.sulleong.coderoom.site' : null,
      expires: new Date(0),
    });

    res.json({
      statusCode: 200,
      message: '로그아웃 되었습니다.',
      data: null,
      path: req.url,
    });
  }
}
