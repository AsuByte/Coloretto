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
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const create_game_dto_1 = require("./dto/create-game-dto");
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getAvailableGames(page, pageSize) {
        return this.gameService.getAvailableGames(page, pageSize);
    }
    async getGameByName(gameName) {
        const decodedGameName = decodeURIComponent(gameName);
        return await this.gameService.findGameByName(decodedGameName);
    }
    async getUserGame(owner) {
        return await this.gameService.findGameByUser(owner);
    }
    async getReplaceableAIs(gameName) {
        const ais = await this.gameService.getReplaceableAIs(gameName);
        return { ais };
    }
    async shouldEndRound(gameName) {
        const shouldEnd = await this.gameService.handleRoundEnd(gameName);
        return { shouldEndRound: shouldEnd };
    }
    async getPreparationTimeRemaining(gameName) {
        const timeRemaining = await this.gameService.getPreparationTimeRemaining(gameName);
        return { timeRemaining };
    }
    async createGame(createGameDto) {
        this.validateGameCreation(createGameDto);
        return await this.gameService.createGame(createGameDto);
    }
    async joinGame(body) {
        return await this.gameService.joinGame(body.gameName, body.username);
    }
    async createAIGameOnly(body) {
        return await this.gameService.createAIGameOnly(body.gameName, body.owner, body.aiCount, body.difficulty);
    }
    async prepareGame(gameName) {
        const game = await this.gameService.findGameByName(gameName);
        return await this.gameService.prepareGame(gameName, game.difficultyLevel);
    }
    async selectDifficultyAndPrepareGame(gameName, level) {
        return await this.gameService.selectDifficultyAndPrepareGame(gameName, level);
    }
    async revealCard(gameName, body) {
        return await this.gameService.revealCard(gameName, body.playerName, body.columnIndex);
    }
    async takeColumn(gameName, playerName, columnIndex) {
        return await this.gameService.takeColumn(gameName, playerName, columnIndex);
    }
    async aiTurn(gameName, aiPlayerName) {
        const result = await this.gameService.executeAiTurn(gameName, aiPlayerName);
        return {
            message: 'AI turn executed',
            actions: Array.isArray(result) ? result : [result],
        };
    }
    async joinWithAIReplacement(gameName, username) {
        const result = await this.gameService.joinGameWithAIReplacement(gameName, username);
        this.validateReplacementResult(result);
        return result;
    }
    async replaceAI(gameName, body) {
        const result = await this.gameService.replaceAIWithPlayer(gameName, body.originalAI, body.newPlayer);
        this.validateReplacementResult(result);
        return result;
    }
    async endRound(gameName) {
        return await this.gameService.handleRoundEnd(gameName);
    }
    async finalizeScores(gameName) {
        return await this.gameService.finalizeAndCalculateScores(gameName);
    }
    async leaveGame(gameName, username) {
        await this.gameService.leaveGame(gameName, username);
        return { message: 'Player left the game' };
    }
    validateGameCreation(createGameDto) {
        if (createGameDto.maxPlayers < 2 || createGameDto.maxPlayers > 5) {
            throw new common_1.BadRequestException('Players must be between 2 and 5');
        }
    }
    validateReplacementResult(result) {
        if (!result.success) {
            throw new common_1.BadRequestException(result.message);
        }
    }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(3), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getAvailableGames", null);
__decorate([
    (0, common_1.Get)(':gameName'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGameByName", null);
__decorate([
    (0, common_1.Get)('owner/:owner'),
    __param(0, (0, common_1.Param)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getUserGame", null);
__decorate([
    (0, common_1.Get)(':gameName/replaceable-ais'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getReplaceableAIs", null);
__decorate([
    (0, common_1.Get)(':gameName/should-end-round'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "shouldEndRound", null);
__decorate([
    (0, common_1.Get)(':gameName/preparation-time'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getPreparationTimeRemaining", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_game_dto_1.CreateGameDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createGame", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "joinGame", null);
__decorate([
    (0, common_1.Post)('ai/create-only'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createAIGameOnly", null);
__decorate([
    (0, common_1.Post)(':gameName/prepare'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "prepareGame", null);
__decorate([
    (0, common_1.Post)(':gameName/select-difficulty'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "selectDifficultyAndPrepareGame", null);
__decorate([
    (0, common_1.Post)(':gameName/reveal-card'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "revealCard", null);
__decorate([
    (0, common_1.Post)(':gameName/take-column'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)('playerName')),
    __param(2, (0, common_1.Body)('columnIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "takeColumn", null);
__decorate([
    (0, common_1.Post)(':gameName/ai-turn'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)('aiPlayerName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "aiTurn", null);
__decorate([
    (0, common_1.Post)(':gameName/join-with-replacement'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "joinWithAIReplacement", null);
__decorate([
    (0, common_1.Post)(':gameName/replace-ai'),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "replaceAI", null);
__decorate([
    (0, common_1.Post)(':gameName/end-round'),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "endRound", null);
__decorate([
    (0, common_1.Post)(':gameName/finalize-scores'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('gameName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "finalizeScores", null);
__decorate([
    (0, common_1.Delete)(':gameName/leave/:username'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('gameName')),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "leaveGame", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameController);
//# sourceMappingURL=game.controller.js.map