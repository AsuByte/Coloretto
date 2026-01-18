import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/users/user.schema';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';
import { AuthModule } from '@/users/auth/auth.module';
import { UploadService } from '@/users/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
  ],

  providers: [UsersService, UploadService],
  controllers: [UsersController],
  exports: [
    UsersService,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class UsersModule {}
