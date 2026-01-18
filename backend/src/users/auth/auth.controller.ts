import { Request, Response } from 'express';
import {
  Controller,
  Param,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login';
import {
  UserValidationException,
  UserValidationError,
} from '@/users/users-exception';
import { UsersService } from '@/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('/:username/connection-time')
  async getConnectionTime(
    @Param('username') username: string,
    @Res() res: Response,
  ) {
    try {
      if (!username) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'A valid username was not provided.' });
      }

      if (username) {
        const connectionTime =
          await this.authService.getConnectionTime(username);

        return res.status(HttpStatus.OK).json({ connectionTime });
      } else {
        throw new Error('A valid username was not provided in the request.');
      }
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error obtaining connection time.' });
    }
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
  ): Promise<any | null> {
    const { username, password } = loginDto;

    const token = await this.authService.login(username, password);

    if (!token) {
      throw new UserValidationException(
        UserValidationError.CredentialInvalid,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.userService.updateLastSeen(username, new Date(), true);

    const user = await this.userService.findUserByUserName(username);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(HttpStatus.OK).json({
      token: token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline,
        connectionStartTime: user.connectionStartTime,
      },
    });
  }

  @Post('verify-token')
  async verifyToken(@Req() req: Request, @Res() res: Response) {
    const { token } = req.cookies;

    const userData = await this.authService.verifyToken(token);

    return res.status(HttpStatus.OK).json(userData);
  }

  @Post('refresh-token')
  async refreshToken(@Req() request: Request): Promise<{ token: string }> {
    try {
      const tokens = request.cookies;

      if (!tokens || !tokens.token) {
        throw new UserValidationException(
          UserValidationError.TokenInvalid,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const newToken = await this.authService.refreshToken(tokens.token);

      return { token: newToken };
    } catch (error) {
      throw new UserValidationException(
        UserValidationError.TokenInvalid,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      res.clearCookie('token');

      const { token } = req.cookies;

      if (token) {
        const decodedToken: any = this.jwtService.decode(token);
        if (decodedToken) {
          const username = decodedToken.username;
          await this.userService.updateLastSeen(username, new Date(), false);
        }
      }

      return res.status(HttpStatus.OK).json({
        message: 'You have logged out. We hope you will be back soon!',
      });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Logout error.' });
    }
  }
}
