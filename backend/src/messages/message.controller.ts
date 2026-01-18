import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { MessagesService } from '@/messages/message.service';
import { Message } from '@/messages/message.schema';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('/general')
  async findAll(): Promise<Message[]> {
    return this.messagesService.findAllMessages();
  }

  @Get('/game')
  async findAllGame(@Query('gameName') gameName: string): Promise<Message[]> {
    return this.messagesService.findAllMessagesGame(gameName);
  }

  @Delete('/game/:gameName')
  async deleteByGame(
    @Param('gameName') gameName: string,
  ): Promise<{ deletedCount: number }> {
    return this.messagesService.deleteMessagesByGame(gameName);
  }
}
