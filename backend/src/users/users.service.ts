import { Model, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/users/user.schema';
import {
  UserValidationException,
  UserValidationError,
} from '@/users/users-exception';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async getAllUsernames(): Promise<string[]> {
    const users = await this.userModel.find().select('username').exec();
    return users.map((user) => user.username);
  }

  async areThereAnyUsers(): Promise<boolean> {
    const count = await this.userModel.countDocuments().exec();

    return count > 0;
  }

  async createUser(
    fullname: string,
    username: string,
    email: string,
    password: string,
    profilePicture: string,
  ): Promise<User> {
    if (password.length < 8) {
      throw new UserValidationException(
        UserValidationError.PasswordShort,
        HttpStatus.LENGTH_REQUIRED,
      );
    }

    const existingUserName = await this.findUserByUserName(username);

    if (existingUserName) {
      throw new UserValidationException(
        UserValidationError.UsernameTaken,
        HttpStatus.CONFLICT,
      );
    }

    const existingUserEmail = await this.findUserByEmail(email);

    if (existingUserEmail) {
      throw new UserValidationException(
        UserValidationError.EmailTaken,
        HttpStatus.CONFLICT,
      );
    }

    const newUser = new this.userModel({
      _id: new mongoose.Types.ObjectId(),
      fullname,
      username,
      email,
      password,
      profilePicture,
    });

    return newUser.save();
  }

  async findById(_id: string): Promise<User | undefined> {
    return this.userModel.findOne({ _id }).exec();
  }

  async findUserByUserName(username: string): Promise<User | undefined> {
    return this.userModel.findOne({ username }).exec();
  }

  async findUserIdsByUsernames(usernames: string[]): Promise<Types.ObjectId[]> {
    const userIds = await this.userModel
      .find({ username: { $in: usernames } })
      .select('_id')
      .exec();
    if (userIds.length !== usernames.length) {
      throw new NotFoundException(
        'One or more users could not be found by ID.',
      );
    }
    return userIds.map((user) => new Types.ObjectId(user._id));
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async changeEmail(username: string, password: string, newEmail: string) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new UserValidationException(
        UserValidationError.UserNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.password !== password) {
      throw new UserValidationException(
        UserValidationError.PasswordNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.email === newEmail) {
      throw new UserValidationException(
        UserValidationError.EmailSame,
        HttpStatus.CONFLICT,
      );
    }

    const emailExists = await this.userModel.findOne({ email: newEmail });

    if (emailExists) {
      throw new UserValidationException(
        UserValidationError.EmailAlreadyExists,
        HttpStatus.CONFLICT,
      );
    }

    user.email = newEmail;

    await user.save();
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
    verifyPassword: string,
  ) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new UserValidationException(
        UserValidationError.UserNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (currentPassword !== user.password) {
      throw new UserValidationException(
        UserValidationError.PasswordNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (newPassword === currentPassword) {
      throw new UserValidationException(
        UserValidationError.PasswordSame,
        HttpStatus.CONFLICT,
      );
    }

    if (newPassword !== verifyPassword) {
      throw new UserValidationException(
        UserValidationError.PasswordNotEqual,
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = newPassword;

    await user.save();
  }

  async updateProfilePicture(username: string, profilePicturePath: string) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new UserValidationException(
        UserValidationError.UserNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    user.profilePicture = profilePicturePath;
    await user.save();
  }

  async updateConnectionStartTime(
    userId: string,
    startTime: Date,
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new UserValidationException(
          UserValidationError.UserNotFound,
          HttpStatus.UNAUTHORIZED,
        );
      }

      user.connectionStartTime = startTime;

      await user.save();
    } catch (error) {
      throw new Error('Error updating user connection time.');
    }
  }

  async updateLastSeen(
    username: string,
    lastSeen: Date | null,
    isOnline: boolean,
  ): Promise<void> {
    try {
      const user = await this.userModel.findOne({ username }).exec();

      if (!user) {
        throw new Error('User not found.');
      }

      user.lastSeen = lastSeen;
      user.isOnline = isOnline;
      await user.save();
    } catch (error) {
      throw new Error('Error updating lastSeen in updateLastSeen.');
    }
  }

  async deleteUser(username: string): Promise<void> {
    const result = await this.userModel.deleteOne({ username }).exec();

    if (result.deletedCount === 0) {
      throw new UserValidationException(
        UserValidationError.UserNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
