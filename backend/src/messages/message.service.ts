import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from '@/messages/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {}

  async createMessage(
    sender: string,
    text: string,
    references: string[] = [],
    gameName?: string,
  ): Promise<Message> {
    const newMessage = new this.messageModel({
      sender,
      text,
      references,
      gameName,
    });
    return newMessage.save();
  }

  async addReaction(
    messageId: string,
    emoji: string,
    user: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findOne({ messageId }).exec();
    if (!message) {
      throw new Error('Message not found.');
    }

    if (!message.reactions) {
      message.reactions = new Map();
    }

    const users = message.reactions.get(emoji) || [];
    if (!users.includes(user)) {
      users.push(user);
      message.reactions.set(emoji, users);
    }

    return message.save();
  }

  async findAllMessages(): Promise<Message[]> {
    return this.messageModel
      .find({ gameName: { $exists: false } })
      .sort({ sentAt: 1 })
      .exec();
  }

  async findAllMessagesGame(gameName: string): Promise<Message[]> {
    return this.messageModel.find({ gameName }).sort({ sentAt: 1 }).exec();
  }

  async findMessageById(messageId: string): Promise<Message> {
    return this.messageModel.findOne({ messageId }).exec();
  }

  async getMessagesForUser(username: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [{ sender: username }, { mentions: username }],
      })
      .exec();
  }

  async getMessagesForGame(gameName: string): Promise<Message[]> {
    return this.messageModel.find({ gameName }).sort({ sentAt: 1 }).exec();
  }

  async removeReaction(
    messageId: string,
    emoji: string,
    user: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findOne({ messageId }).exec();
    if (!message) {
      throw new Error('Message not found.');
    }

    if (message.reactions?.has(emoji)) {
      const users = message.reactions.get(emoji).filter((u) => u !== user);

      if (users.length === 0) {
        message.reactions.delete(emoji);
      } else {
        message.reactions.set(emoji, users);
      }

      return message.save();
    }

    return message;
  }

  async deleteMessagesByGame(
    gameName: string,
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await this.messageModel.deleteMany({ gameName }).exec();
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      console.error(`Error deleting messages for game ${gameName}:`, error);
      throw new Error(`Failed to delete messages for game ${gameName}`);
    }
  }
}
