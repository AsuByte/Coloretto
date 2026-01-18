import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';

import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/users/auth/auth.module';
import { UploadService } from '@/users/upload.service';
import { ChatGateway } from '@/chats/chat.gateway';
import { MessageModule } from '@/messages/message.module';
import { GameModule } from '@/games/game.module';

config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UsersModule,
    AuthModule,
    MessageModule,
    GameModule,
  ],
  providers: [ChatGateway, UploadService],
})
export class AppModule {}
