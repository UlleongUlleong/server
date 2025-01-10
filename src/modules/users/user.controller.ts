import { Controller, Get, UseGuards, Request, Put, Body} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { categoryDto, ProfileDto, ResponseProfileDto } from './dtos/profile.dto'

@Controller('users')
export class UsersController {
  constructor(private authService: AuthService, private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserCategory(@Request() req): Promise<ResponseProfileDto>{
    try {
      const { userId, email }: ProfileDto = req.user;
      const userProfile = await this.userService.findUserProfile(userId)
      return userProfile
    } catch (err) {
      console.log(err)
      return err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateUserCategory(@Request() req, @Body() categoryDto: categoryDto): Promise<ResponseProfileDto> {
    try{
      const { userId, email }: ProfileDto = req.user;
      const { alcoholCategory, moodCategory } = req.body;
      const userProfile = await this.userService.updateUserProfile(userId, alcoholCategory, moodCategory)
      return userProfile
    } catch(err) {
      return err
    }
  }
}