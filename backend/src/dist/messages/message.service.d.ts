import { Model } from 'mongoose';
import { Message, MessageDocument } from '@/messages/message.schema';
export declare class MessagesService {
    private readonly messageModel;
    constructor(messageModel: Model<Message>);
    createMessage(sender: string, text: string, references?: string[], gameName?: string): Promise<Message>;
    addReaction(messageId: string, emoji: string, user: string): Promise<MessageDocument>;
    findAllMessages(): Promise<Message[]>;
    findAllMessagesGame(gameName: string): Promise<Message[]>;
    findMessageById(messageId: string): Promise<Message>;
    getMessagesForUser(username: string): Promise<Message[]>;
    getMessagesForGame(gameName: string): Promise<Message[]>;
    removeReaction(messageId: string, emoji: string, user: string): Promise<MessageDocument>;
    deleteMessagesByGame(gameName: string): Promise<{
        deletedCount: number;
    }>;
}
