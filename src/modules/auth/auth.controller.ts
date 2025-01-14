import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  UseGuards,
  Req,
  Headers,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { EmailDto } from './dtos/email.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { UserPayload } from './interfaces/user-payload.interface';
import { CreateUserDto } from './dtos/create-user.dto';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Response } from 'express';
import { UserInfo } from './interfaces/userInfo.inerface';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { OAuthRequest } from './interfaces/oauth-request.interface';
import { NicknameDto } from './dtos/nickname.dto';

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

  @Post('activate')
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

  @Get('refresh')
  async refresh(@Headers() headers, @Res() res): Promise<ApiResponse<string>> {
    let token = headers['authorization'];
    token = token.replace('Bearer ', '');
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    res.header('Authorization', `Bearer ${accessToken}`);
    return res.status(200).json({
      status: 'success',
      data: refreshToken,
      message: '토큰 재발급',
    });
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: OAuthRequest,
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

  @Get('/naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin(): Promise<void> {}

  @Get('/naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback(
    @Req() req: OAuthRequest,
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

  @Get('/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(): Promise<void> {}

  @Get('/kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(
    @Req() req: OAuthRequest,
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

  @Post('/accounts')
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.registerEmailUser(createUserDto);

    return {
      status: 'success',
      data: null,
      message: '회원가입이 완료되었습니다.',
    };
  }

  @Get('/accounts/email')
  async checkEmailExists(
    @Query() emailDto: EmailDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.checkEmailDuplication(emailDto);

    return {
      status: 'success',
      data: null,
      message: '사용가능한 이메일입니다.',
    };
  }

  @Get('/accounts/nickname')
  async checkNicknameExists(
    @Query() nicknameDto: NicknameDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.checkNicknameDuplication(nicknameDto);

    return {
      status: 'success',
      data: null,
      message: '사용가능한 닉네임입니다.',
    };
  }

  @Post('/email-codes')
  async sendEmailCode(@Body() emailDto: EmailDto): Promise<ApiResponse<null>> {
    await this.authService.sendEmailCode(emailDto);

    return {
      status: 'success',
      data: null,
      message: '인증코드가 메일로 발송되었습니다.',
    };
  }

  @Post('/email-codes/verification')
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
