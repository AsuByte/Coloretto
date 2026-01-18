import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller()
export class AppController {
  private messages: string[] = [];

  @Get()
  getMessages(): string[] {
    return this.messages;
  }

  @Post()
  addMessage(@Body('message') message: string): void {
    this.messages.push(message);
  }
}
