import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '@/users/users.service';
import { AuthService } from '@/users/auth/auth.service';
import { UploadService } from '@/users/upload.service';

@Controller('users')
export class UsersController {
  private static readonly DEFAULT_PROFILE_PICTURE =
    'https://res.cloudinary.com/dtrjovuji/image/upload/v1728909714/wjdzq2scuj9fc16ctrnt.png';
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('/usernames')
  async getAllUsernames(): Promise<string[]> {
    try {
      const usernames = await this.usersService.getAllUsernames();
      return usernames;
    } catch (error) {
      throw new Error('Error retrieving usernames.');
    }
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    const user = await this.usersService.findUserByUserName(username);

    if (!user) {
      return null;
    }

    return user;
  }

  @Post('register')
  async register(
    @Body('fullname') fullname: string,
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const profilePicture = UsersController.DEFAULT_PROFILE_PICTURE;

    const user = await this.usersService.createUser(
      fullname,
      username,
      email,
      password,
      profilePicture,
    );

    const token = await this.authService.generateToken(user._id);

    return { message: 'It has been successfully registered.', token };
  }

  @Put('/profile/:username/change-email')
  async changeEmail(
    @Param('username') username: string,
    @Body('password') password: string,
    @Body('newEmail') newEmail: string,
  ) {
    await this.usersService.changeEmail(username, password, newEmail);

    return { message: 'Email updated successfully.' };
  }

  @Put('/profile/:username/change-password')
  async changePassword(
    @Param('username') username: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Body('verifyPassword') verifyPassword: string,
  ) {
    await this.usersService.changePassword(
      username,
      currentPassword,
      newPassword,
      verifyPassword,
    );

    return { message: 'Password successfully updated.' };
  }

  @Put('/profile/:username/update-profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @Param('username') username: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('You must provide a valid file.');
    }

    const fileUrl = await this.uploadService.uploadFile(file);
    await this.usersService.updateProfilePicture(username, fileUrl);

    return { message: 'Profile picture updated successfully.' };
  }

  @Delete('/:username')
  async deleteUser(@Param('username') username: string) {
    await this.usersService.deleteUser(username);

    return { message: 'Successfully deleted user.' };
  }
}
