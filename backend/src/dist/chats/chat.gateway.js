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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const message_service_1 = require("../messages/message.service");
let ChatGateway = class ChatGateway {
    constructor(messagesService) {
        this.messagesService = messagesService;
        this.connectedUsers = new Map();
        this.typingUsers = new Map();
    }
    afterInit() { }
    handleConnection(client) {
        const userName = client.handshake.query.userName;
        const gameName = client.handshake.query.gameName;
        if (userName && gameName) {
            const userMap = this.connectedUsers.get(gameName) || new Map();
            userMap.set(client.id, { name: userName, isConnected: true });
            this.connectedUsers.set(gameName, userMap);
            client.join(gameName);
            this.updateConnectedUsers(gameName);
        }
        this.loadMessages(client, gameName);
    }
    handleDisconnect(client) {
        const gameName = client.handshake.query.gameName;
        const userMap = this.connectedUsers.get(gameName);
        if (userMap) {
            userMap.delete(client.id);
            if (userMap.size === 0) {
                this.connectedUsers.delete(gameName);
            }
            this.updateConnectedUsers(gameName);
        }
    }
    async handleMessage(message) {
        const references = this.extractReferences(message.text);
        const newMessage = await this.messagesService.createMessage(message.sender, message.text, references, message.gameName);
        if (message.gameName) {
            this.server.to(message.gameName).emit('message', newMessage);
        }
        else {
            this.server.emit('general', newMessage);
        }
        return newMessage;
    }
    async handleReaction(reaction) {
        try {
            const updatedMessage = await this.messagesService.addReaction(reaction.messageId, reaction.emoji, reaction.user);
            if (reaction.gameName) {
                this.server
                    .to(reaction.gameName)
                    .emit('reaction-updated', updatedMessage);
            }
            else {
                this.server.emit('reaction-updated', updatedMessage);
            }
            return updatedMessage;
        }
        catch (error) {
            return null;
        }
    }
    async handleRemoveReaction(client, payload) {
        const { messageId, emoji, user } = payload;
        try {
            const updatedMessage = await this.messagesService.removeReaction(messageId, emoji, user);
            if (updatedMessage) {
                this.server.emit('reaction-removed', updatedMessage);
            }
        }
        catch (error) {
            return null;
        }
    }
    handleTyping(client, payload) {
        const gameName = client.handshake.query.gameName;
        this.updateTypingUsers(gameName, payload.user, true);
    }
    handleStopTyping(client, payload) {
        const gameName = client.handshake.query.gameName;
        this.updateTypingUsers(gameName, payload.user, false);
    }
    handleTypingGame(client, payload) {
        const usersInTyping = this.typingUsers.get(payload.gameName) || new Set();
        usersInTyping.add(payload.user);
        this.typingUsers.set(payload.gameName, usersInTyping);
        this.server
            .to(payload.gameName)
            .emit('typingGame', Array.from(usersInTyping));
    }
    handleStopTypingGame(client, payload) {
        const usersInTyping = this.typingUsers.get(payload.gameName);
        if (usersInTyping) {
            usersInTyping.delete(payload.user);
            this.typingUsers.set(payload.gameName, usersInTyping);
            this.server
                .to(payload.gameName)
                .emit('typingGame', Array.from(usersInTyping));
        }
    }
    async loadMessages(client, gameName) {
        let messages = [];
        if (gameName) {
            messages = await this.messagesService.findAllMessagesGame(gameName);
        }
        else {
            messages = await this.messagesService.findAllMessages();
        }
        client.emit('messages', messages);
    }
    updateConnectedUsers(gameName) {
        const userMap = this.connectedUsers.get(gameName);
        if (userMap) {
            const users = Array.from(userMap.values());
            this.server.to(gameName).emit('users-updated', users);
        }
    }
    updateTypingUsers(gameName, user, isTyping) {
        const usersInTyping = this.typingUsers.get(gameName) || new Set();
        if (isTyping) {
            usersInTyping.add(user);
        }
        else {
            usersInTyping.delete(user);
        }
        this.typingUsers.set(gameName, usersInTyping);
        this.server.to(gameName).emit('typing', Array.from(usersInTyping));
    }
    extractReferences(message) {
        const regex = /@(\w+)/g;
        const references = [];
        let match;
        while ((match = regex.exec(message)) !== null) {
            references.push(match[1]);
        }
        return references;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reaction'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('remove-reaction'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRemoveReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop-typing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typingGame'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop-typingGame'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTypingGame", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [message_service_1.MessagesService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map