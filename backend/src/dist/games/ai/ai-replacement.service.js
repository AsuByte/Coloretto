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
exports.AiReplacementService = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const common_1 = require("@nestjs/common");
const game_schema_1 = require("../game.schema");
const game_gateway_1 = require("../game.gateway");
const ai_phase_preparation_service_1 = require("./ai-phase-preparation.service");
let AiReplacementService = class AiReplacementService {
    constructor(gameModel, preparationAI, gameGateway) {
        this.gameModel = gameModel;
        this.preparationAI = preparationAI;
        this.gameGateway = gameGateway;
    }
    async replaceAIWithPlayer(gameName, originalAIName, newPlayerName) {
        try {
            const game = await this.gameModel.findOne({ gameName });
            if (!game) {
                throw new Error(`Game ${gameName} not found`);
            }
            const validationError = this.validateReplacement(game, originalAIName, newPlayerName);
            if (validationError) {
                return validationError;
            }
            await this.copyAIProgressToPlayer(game, originalAIName, newPlayerName);
            game.players.push(newPlayerName);
            game.aiPlayers = game.aiPlayers.filter((ai) => ai.name !== originalAIName);
            this.registerReplacement(game, originalAIName, newPlayerName);
            this.updateTurnAfterReplacement(game, originalAIName, newPlayerName);
            this.updatePlayersTakenColumn(game, originalAIName, newPlayerName);
            await game.save();
            this.emitReplacementEvents(gameName, originalAIName, newPlayerName, game);
            return {
                success: true,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: 'IA replaced correct',
                gameState: game,
            };
        }
        catch (error) {
            return {
                success: false,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: `Error: ${error.message}`,
            };
        }
    }
    async replacePlayerWithAI(gameName, playerName) {
        try {
            const game = await this.gameModel.findOne({ gameName });
            if (!game) {
                throw new Error(`Game ${gameName} not found`);
            }
            if (!game.players.includes(playerName)) {
                return {
                    success: false,
                    originalAI: playerName,
                    newPlayer: '',
                    message: `Player ${playerName} not found`,
                };
            }
            const allExistingPlayers = this.getAllPlayers(game);
            const newAINames = this.preparationAI.generateAIPlayerNames(1, allExistingPlayers);
            const newAIName = newAINames[0];
            this.copyCollection(game.playerCollections, playerName, newAIName);
            this.copyCollection(game.wildCards, playerName, newAIName);
            this.copyCollection(game.summaryCards, playerName, newAIName);
            game.players = game.players.filter((p) => p !== playerName);
            const aiDifficulty = game.difficultyLevel;
            game.aiPlayers.push({
                name: newAIName,
                difficulty: aiDifficulty,
                strategy: this.preparationAI.determineStrategy(aiDifficulty),
            });
            const allPlayers = this.getAllPlayers(game);
            const playerIndex = allPlayers.indexOf(playerName);
            if (playerIndex !== -1 && game.currentPlayerIndex === playerIndex) {
                const newAIIndex = allPlayers.indexOf(newAIName);
                if (newAIIndex !== -1) {
                    game.currentPlayerIndex = newAIIndex;
                }
            }
            if (game.playersTakenColumn.includes(playerName)) {
                game.playersTakenColumn = game.playersTakenColumn.map((p) => p === playerName ? newAIName : p);
            }
            await game.save();
            this.gameGateway.emitToGame(gameName, 'player_replaced_by_ai', {
                originalPlayer: playerName,
                newAI: newAIName,
                game: this.gameGateway.sanitizeGameForEmission(game),
                timestamp: new Date(),
            });
            this.gameGateway.emitGameStateChanged(game);
            return {
                success: true,
                originalAI: playerName,
                newPlayer: newAIName,
                message: 'Player replaced for IA correct',
                gameState: game,
            };
        }
        catch (error) {
            return {
                success: false,
                originalAI: playerName,
                newPlayer: '',
                message: `Error: ${error.message}`,
            };
        }
    }
    validateReplacement(game, originalAIName, newPlayerName) {
        if (game.isRoundCardRevealed) {
            return {
                success: false,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: 'AI cannot be replaced during the end of the round',
            };
        }
        const allPlayers = this.getAllPlayers(game);
        if (game.playersTakenColumn.length === allPlayers.length) {
            return {
                success: false,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: 'You cannot replace AI while all players are taking columns',
            };
        }
        const aiPlayer = game.aiPlayers.find((ai) => ai.name === originalAIName);
        if (!aiPlayer) {
            return {
                success: false,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: `IA ${originalAIName} not found in the game`,
            };
        }
        if (this.isPlayerNameTaken(game, newPlayerName)) {
            return {
                success: false,
                originalAI: originalAIName,
                newPlayer: newPlayerName,
                message: `The name ${newPlayerName} is used`,
            };
        }
        return null;
    }
    async copyAIProgressToPlayer(game, aiName, playerName) {
        this.copyCollection(game.playerCollections, aiName, playerName);
        this.copyCollection(game.wildCards, aiName, playerName);
        this.copyCollection(game.summaryCards, aiName, playerName);
    }
    copyCollection(collection, from, to) {
        if (collection instanceof Map) {
            const sourceCollection = collection.get(from) || [];
            collection.set(to, [...sourceCollection]);
            collection.delete(from);
        }
        else if (collection) {
            collection[to] = collection[from] || [];
            delete collection[from];
        }
    }
    registerReplacement(game, originalAIName, newPlayerName) {
        if (!game.replacedPlayers)
            game.replacedPlayers = new Map();
        game.replacedPlayers.set(newPlayerName, {
            originalAIName,
            replacedBy: newPlayerName,
            replacedAt: new Date(),
        });
    }
    updateTurnAfterReplacement(game, originalAIName, newPlayerName) {
        const allPlayers = this.getAllPlayers(game);
        if (allPlayers[game.currentPlayerIndex] === originalAIName) {
            const newIndex = allPlayers.indexOf(newPlayerName);
            if (newIndex !== -1) {
                game.currentPlayerIndex = newIndex;
            }
        }
    }
    updatePlayersTakenColumn(game, originalAIName, newPlayerName) {
        if (game.playersTakenColumn.includes(originalAIName)) {
            game.playersTakenColumn = game.playersTakenColumn.map((player) => player === originalAIName ? newPlayerName : player);
        }
    }
    emitReplacementEvents(gameName, originalAI, newPlayer, game) {
        this.gameGateway.emitToGame(gameName, 'ai_replaced', {
            originalAI,
            newPlayer,
            game: this.gameGateway.sanitizeGameForEmission(game),
            timestamp: new Date(),
        });
        this.gameGateway.emitGameStateChanged(game);
    }
    getAllPlayers(game) {
        return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
    }
    isPlayerNameTaken(game, playerName) {
        return (game.players.includes(playerName) ||
            game.aiPlayers.some((ai) => ai.name === playerName));
    }
    async getReplaceableAIs(gameName) {
        const game = await this.gameModel.findOne({ gameName });
        if (!game)
            return [];
        return game.aiPlayers.map((ai) => ai.name);
    }
    canReplaceAI(game, aiName) {
        if (game.isFinished)
            return false;
        const aiExists = game.aiPlayers.some((ai) => ai.name === aiName);
        if (!aiExists)
            return false;
        const totalPlayers = game.players.length + game.aiPlayers.length;
        if (totalPlayers >= game.maxPlayers)
            return true;
        return true;
    }
    async joinGameWithAIReplacement(gameName, username) {
        const game = await this.gameModel.findOne({ gameName });
        if (!game) {
            throw new Error(`Game ${gameName} not found`);
        }
        if (this.isPlayerNameTaken(game, username)) {
            return {
                success: false,
                originalAI: '',
                newPlayer: username,
                message: 'You are already in this game',
            };
        }
        const replaceableAIs = await this.getReplaceableAIs(gameName);
        if (replaceableAIs.length === 0) {
            return {
                success: false,
                originalAI: '',
                newPlayer: username,
                message: 'There are no AIs available to replace',
            };
        }
        const aiToReplace = replaceableAIs[0];
        return await this.replaceAIWithPlayer(gameName, aiToReplace, username);
    }
};
exports.AiReplacementService = AiReplacementService;
exports.AiReplacementService = AiReplacementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(game_schema_1.Game.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        ai_phase_preparation_service_1.AiPhasePreparationService,
        game_gateway_1.GameGateway])
], AiReplacementService);
//# sourceMappingURL=ai-replacement.service.js.map