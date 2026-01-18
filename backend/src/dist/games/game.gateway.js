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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const ai_phase_turn_service_1 = require("./ai/ai-phase-turn.service");
let GameGateway = class GameGateway {
    constructor(aiPhaseTurnService) {
        this.aiPhaseTurnService = aiPhaseTurnService;
    }
    afterInit() { }
    handleConnection() { }
    handleDisconnect() { }
    emitGameCreated(game) {
        this.server.emit('gameCreated', this.sanitizeGameForEmission(game));
    }
    emitPlayerJoined(game, username, replacedAI) {
        const data = {
            username,
            players: game.players,
            currentPlayers: game.players.length,
            game: this.sanitizeGameForEmission(game),
        };
        if (replacedAI) {
            data.replacedAI = replacedAI;
            data.isAIReplacement = true;
        }
        this.server.to(game.gameName).emit('player_joined', data);
        this.server.emit('playerJoined', { username });
    }
    emitOwnerChanged(game, data) {
        this.server.to(game.gameName).emit('ownerChanged', {
            gameName: game.gameName,
            oldOwner: data.oldOwner,
            newOwner: data.newOwner,
            game: this.sanitizeGameForEmission(game),
            wasOwner: data.wasOwner,
            timestamp: new Date(),
        });
        this.server.emit('ownerChangedGlobal', {
            gameName: game.gameName,
            newOwner: data.newOwner,
        });
    }
    emitOwnerReplacedByAI(game, originalOwner, newAI) {
        this.server.to(game.gameName).emit('owner_replaced_by_ai', {
            game: this.sanitizeGameForEmission(game),
            originalOwner,
            newAI,
            timestamp: new Date(),
            players: game.players,
            aiPlayers: game.aiPlayers,
            newOwner: game.owner,
        });
    }
    emitAIRepalaced(game, originalAI, newPlayer) {
        this.server.to(game.gameName).emit('ai_replaced', {
            game: this.sanitizeGameForEmission(game),
            originalAI,
            newPlayer,
            timestamp: new Date(),
        });
        this.emitGameStateChanged(game);
    }
    emitPlayerLeft(game, username) {
        this.server.emit('playerLeft', {
            game: this.sanitizeGameForEmission(game),
            username,
            timestamp: new Date(),
        });
        this.emitGameStateChanged(game);
    }
    emitGameDeleted(gameName) {
        this.server.emit('gameDeleted', { gameName });
    }
    emitGamePrepared(game) {
        this.server.emit('gamePrepared', this.sanitizeGameForEmission(game));
    }
    emitGameListUpdated() {
        this.server.emit('gameListUpdated');
    }
    emitGameStateChanged(game) {
        this.server.emit('gameStateChanged', this.sanitizeGameForEmission(game));
    }
    emitPreparationStarted(game) {
        this.server.emit('preparationStarted', {
            gameName: game.gameName,
            preparationTime: game.preparationTime,
            difficulty: game.difficultyLevel,
        });
    }
    emitCardsAssigned(game) {
        this.server.emit('cardsAssigned', this.sanitizeGameForEmission(game));
    }
    emitNextTurn(game) {
        const allPlayers = [
            ...game.players,
            ...game.aiPlayers.map((ai) => ai.name),
        ];
        const currentPlayer = allPlayers[game.currentPlayerIndex];
        this.server.emit('nextTurn', {
            gameName: game.gameName,
            currentPlayerIndex: game.currentPlayerIndex,
            currentPlayer: currentPlayer,
            isAIPlayer: game.aiPlayers.some((ai) => ai.name === currentPlayer),
        });
    }
    emitReassignmentStarting(game) {
        this.server.to(game.gameName).emit('reassignmentStarting', {
            gameName: game.gameName,
            message: 'End of round. Reassigning column charts...',
            duration: 3000,
            timestamp: new Date(),
            round: game.currentRound,
        });
    }
    emitReassignmentComplete(game) {
        this.server.to(game.gameName).emit('reassignmentComplete', {
            gameName: game.gameName,
            timestamp: new Date(),
            round: game.currentRound,
            game: this.sanitizeGameForEmission(game),
        });
    }
    emitCardRevealed(game, revealedCard) {
        this.server.emit('cardRevealed', {
            game: this.sanitizeGameForEmission(game),
            revealedCard,
        });
    }
    emitAICardRevealed(game, playerId, card, columnIndex) {
        this.server.to(game.gameName).emit('ai_card_revealed', {
            game: this.sanitizeGameForEmission(game),
            revealedCard: card,
            playerName: playerId,
            columnIndex: columnIndex,
            isAI: true,
            timestamp: new Date(),
        });
        this.emitCardRevealed(game, card);
    }
    emitRoundEndCardRevealed(game, playerId, card) {
        this.server.emit('round_end_card_revealed', {
            game: this.sanitizeGameForEmission(game),
            card: card,
            playerId: playerId,
            timestamp: new Date(),
        });
        this.server.to(game.gameName).emit('round_end_card_revealed', {
            gameName: this.sanitizeGameForEmission(game),
            playerId: playerId,
            card: card,
            timestamp: new Date(),
        });
    }
    emitAIRoundEndCard(game, playerId, card) {
        ai_phase_turn_service_1.AiPhaseTurnService.recordRoundEndCard(game._id.toString());
        this.server.emit('ai_round_end_card', {
            game: this.sanitizeGameForEmission(game),
            revealedCard: card,
            playerName: playerId,
            isAI: true,
            timestamp: new Date(),
        });
        this.server.to(game.gameName).emit('ai_round_end_card', {
            game: this.sanitizeGameForEmission(game),
            revealedCard: card,
            playerName: playerId,
            isAI: true,
            timestamp: new Date(),
        });
    }
    emitColumnTaken(game, columnIndex, playerName) {
        this.server.emit('columnTaken', {
            game: this.sanitizeGameForEmission(game),
            columnIndex,
            playerName,
            playerCollections: this.convertMapToObject(game.playerCollections),
            wildCards: this.convertMapToObject(game.wildCards),
        });
    }
    emitGameFinalized(game, finalScores, winners) {
        this.emitToGame(game.gameName, 'gameFinalized', {
            game: this.sanitizeGameForEmission(game),
            finalScores,
            winners,
            finalizedAt: new Date(),
        });
    }
    emitGameUnavailable(game) {
        this.server.emit('gameUnavailable', {
            gameName: game.gameName,
            game: this.sanitizeGameForEmission(game),
            timestamp: new Date(),
        });
    }
    sanitizeGameForEmission(game) {
        let sanitized;
        if (game && typeof game.toObject === 'function') {
            sanitized = game.toObject();
        }
        else {
            sanitized = { ...game };
        }
        if (game.playerCollections instanceof Map) {
            sanitized.playerCollections = this.convertMapToObject(game.playerCollections);
        }
        else if (typeof game.playerCollections === 'object' &&
            game.playerCollections !== null) {
            sanitized.playerCollections = game.playerCollections;
        }
        else {
            sanitized.playerCollections = {};
        }
        if (game.wildCards instanceof Map) {
            sanitized.wildCards = this.convertMapToObject(game.wildCards);
        }
        else if (typeof game.wildCards === 'object' && game.wildCards !== null) {
            sanitized.wildCards = game.wildCards;
        }
        else {
            sanitized.wildCards = {};
        }
        if (game.summaryCards instanceof Map) {
            sanitized.summaryCards = this.convertMapToObject(game.summaryCards);
        }
        else if (typeof game.summaryCards === 'object' &&
            game.summaryCards !== null) {
            sanitized.summaryCards = game.summaryCards;
        }
        else {
            sanitized.summaryCards = {};
        }
        return sanitized;
    }
    convertMapToObject(map) {
        if (!map || !(map instanceof Map)) {
            return {};
        }
        const obj = {};
        for (const [key, value] of map.entries()) {
            obj[key] = value;
        }
        return obj;
    }
    joinGameRoom(client, gameName) {
        client.join(gameName);
    }
    leaveGameRoom(client, gameName) {
        client.leave(gameName);
    }
    emitToRoom(room, event, data) {
        this.server.to(room).emit(event, data);
    }
    emitToGame(gameName, event, data) {
        this.server.to(gameName).emit(event, data);
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
exports.GameGateway = GameGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || '*',
        },
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => ai_phase_turn_service_1.AiPhaseTurnService))),
    __metadata("design:paramtypes", [ai_phase_turn_service_1.AiPhaseTurnService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map