"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
let MessagesService = class MessagesService {
    constructor(messageModel) {
        this.messageModel = messageModel;
    }
    async createMessage(sender, text, references = [], gameName) {
        const newMessage = new this.messageModel({
            sender,
            text,
            references,
            gameName,
        });
        return newMessage.save();
    }
    async addReaction(messageId, emoji, user) {
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
    async findAllMessages() {
        return this.messageModel
            .find({ gameName: { $exists: false } })
            .sort({ sentAt: 1 })
            .exec();
    }
    async findAllMessagesGame(gameName) {
        return this.messageModel.find({ gameName }).sort({ sentAt: 1 }).exec();
    }
    async findMessageById(messageId) {
        return this.messageModel.findOne({ messageId }).exec();
    }
    async getMessagesForUser(username) {
        return this.messageModel
            .find({
            $or: [{ sender: username }, { mentions: username }],
        })
            .exec();
    }
    async getMessagesForGame(gameName) {
        return this.messageModel.find({ gameName }).sort({ sentAt: 1 }).exec();
    }
    async removeReaction(messageId, emoji, user) {
        const message = await this.messageModel.findOne({ messageId }).exec();
        if (!message) {
            throw new Error('Message not found.');
        }
        if (message.reactions?.has(emoji)) {
            const users = message.reactions.get(emoji).filter((u) => u !== user);
            if (users.length === 0) {
                message.reactions.delete(emoji);
            }
            else {
                message.reactions.set(emoji, users);
            }
            return message.save();
        }
        return message;
    }
    async deleteMessagesByGame(gameName) {
        try {
            const result = await this.messageModel.deleteMany({ gameName }).exec();
            return { deletedCount: result.deletedCount || 0 };
        }
        catch (error) {
            console.error(`Error deleting messages for game ${gameName}:`, error);
            throw new Error(`Failed to delete messages for game ${gameName}`);
        }
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)('Message')),
    __metadata("design:paramtypes", [mongoose_1.Model])
], MessagesService);
//# sourceMappingURL=message.service.js.map