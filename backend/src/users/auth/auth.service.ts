import { Injectable, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { Socket } from 'socket.io';
import {
  UserValidationException,
  UserValidationError,
} from '@/users/users-exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async getConnectionTime(username: string): Promise<string> {
    try {
      const user = await this.usersService.findUserByUserName(username);

      if (!user) {
        return null;
      }

      if (user.isOnline) {
        return `Online.`;
      } else {
        const lastSeen = user.lastSeen;

        if (lastSeen) {
          const elapsedTime = await this.calculateElapsedTime(
            new Date(lastSeen),
          );
          const timeString = await this.calculateElapsedTimeString(elapsedTime);

          return `Connected ago ${timeString}.`;
        } else {
          return 'Never Connected.';
        }
      }
    } catch (error) {
      throw new Error('Error obtaining connection time.');
    }
  }

  async calculateElapsedTime(lastSeen: Date): Promise<number> {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastSeen.getTime();
    return elapsedTime;
  }

  async calculateElapsedTimeString(elapsedTime: number): Promise<string> {
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeString = '';
    if (days > 0) {
      timeString += `${days}d`;
    } else if (hours > 0) {
      timeString += `${hours}h`;
    } else if (minutes > 0) {
      timeString += `${minutes}m`;
    } else {
      timeString += `${seconds}s`;
    }

    return timeString;
  }

  async login(username: string, password: string): Promise<string | null> {
    const user = await this.usersService.findUserByUserName(username);

    if (!user) {
      throw new UserValidationException(
        UserValidationError.UserNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (password !== user.password) {
      throw new UserValidationException(
        UserValidationError.PasswordIncorrect,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.usersService.updateConnectionStartTime(user._id, new Date());

    const payload = { username: user.username, sub: user._id };
    return this.jwtService.sign(payload);
  }

  async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };

    return this.jwtService.sign(payload);
  }

  async getUserIdFromSocket(client: Socket): Promise<string> {
    try {
      const token = client.handshake.headers.authorization.replace(
        'Bearer ',
        '',
      );
      const { sub: userId } = this.jwtService.verify(token);
      return userId;
    } catch (error) {
      console.error('Error obtaining socket ID:', error.message);
      throw new UnauthorizedException('Invalid authentication token.');
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      const user = await this.usersService.findById(decoded.sub);

      return { _id: user._id, username: user.username, email: user.email };
    } catch (error) {
      return null;
    }
  }

  async refreshToken(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token);

      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        throw new UserValidationException(
          UserValidationError.UserNotFound,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const newToken = await this.generateToken(user._id);

      return newToken;
    } catch (error) {
      throw new UserValidationException(
        UserValidationError.TokenInvalid,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async logout(username: string): Promise<void> {
    try {
      const user = await this.usersService.findUserByUserName(username);

      if (!user) {
        throw new UserValidationException(
          UserValidationError.UserNotFound,
          HttpStatus.UNAUTHORIZED,
        );
      }

      user.lastSeen = new Date();
      user.isOnline = false;

      await this.usersService.updateLastSeen(
        username,
        user.lastSeen,
        user.isOnline,
      );
    } catch (error) {
      throw new Error('Logout error.');
    }
  }
}
