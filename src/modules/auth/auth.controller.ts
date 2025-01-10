import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CheckEmailDto } from './dtos/check-email.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { UserWithProfile } from './interfaces/user-with-profile.interface';
import { CreateUserDto } from './dtos/create-user.dto';
// import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  // @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
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
    await this.authService.registerEmailUser(createUserDto);

    return {
      status: 'success',
      data: null,
      message: '인증코드가 메일로 발송되었습니다.',
    };
  }
}
