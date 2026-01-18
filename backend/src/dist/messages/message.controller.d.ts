import { MessagesService } from '@/messages/message.service';
import { Message } from '@/messages/message.schema';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findAll(): Promise<Message[]>;
    findAllGame(gameName: string): Promise<Message[]>;
    deleteByGame(gameName: string): Promise<{
        deletedCount: number;
    }>;
}
