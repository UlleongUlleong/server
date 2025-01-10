import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalLoginDto } from './dtos/local-login.dto';
import { Response } from 'express';
import { UserInfo } from './interfaces/userInfo.inerface'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LocalLoginDto, @Res() res: Response): Promise<Response<UserInfo>> {
    try {
      const { accessToken, userInfo }: {accessToken:string, userInfo: UserInfo} = await this.authService.login(loginDto);
      res.header('Authorization', `Bearer ${accessToken}`);
      return res.status(200).json(userInfo);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || '서버 에러' });
    }
  }

  @Post('login/activate')
  async activateAccount(@Body() loginDto: LocalLoginDto, @Res() res: Response): Promise<Response<UserInfo>>{
    try{
      await this.authService.activateAccount(loginDto);
      const { accessToken, userInfo }: {accessToken:string, userInfo: UserInfo} = await this.authService.login(loginDto);
      res.header('Authorization', `Bearer ${accessToken}`);
      return res.status(200).json(userInfo);
    } catch(err) {
      return res.status(err.status || 500).json({ message: err.message || '서버 에러' });
    }
  }
}
