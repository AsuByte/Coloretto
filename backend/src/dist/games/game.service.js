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
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/user.schema");
const message_service_1 = require("../messages/message.service");
const game_schema_1 = require("./game.schema");
const game_gateway_1 = require("./game.gateway");
const phase_preparation_service_1 = require("./phases/phase-preparation.service");
const ai_phase_preparation_service_1 = require("./ai/ai-phase-preparation.service");
const ai_phase_turn_service_1 = require("./ai/ai-phase-turn.service");
const phase_turn_service_1 = require("./phases/phase-turn.service");
const phase_round_end_service_1 = require("./phases/phase-round-end.service");
const ai_phase_round_end_service_1 = require("./ai/ai-phase-round-end.service");
const phase_game_end_service_1 = require("./phases/phase-game-end.service");
const ai_replacement_service_1 = require("./ai/ai-replacement.service");
let GameService = class GameService {
    constructor(gameModel, userModel, messagesService, gameGateway, aiPreparationService, preparationPhase, turnPhase, aiReplacementService, roundEndPhase, aiRoundEndPhase, gameEndPhase, aiPhaseTurnService) {
        this.gameModel = gameModel;
        this.userModel = userModel;
        this.messagesService = messagesService;
        this.gameGateway = gameGateway;
        this.aiPreparationService = aiPreparationService;
        this.preparationPhase = preparationPhase;
        this.turnPhase = turnPhase;
        this.aiReplacementService = aiReplacementService;
        this.roundEndPhase = roundEndPhase;
        this.aiRoundEndPhase = aiRoundEndPhase;
        this.gameEndPhase = gameEndPhase;
        this.aiPhaseTurnService = aiPhaseTurnService;
    }
    async createGame(createGameDto) {
        const newGame = new this.gameModel({
            gameName: createGameDto.gameName,
            owner: createGameDto.owner,
            players: [createGameDto.owner],
            maxPlayers: createGameDto.maxPlayers,
            difficultyLevel: createGameDto.difficultyLevel,
            isPrepared: false,
            currentRound: 0,
            currentPlayerIndex: 0,
            columns: [],
            deck: [],
            playerCollections: new Map(),
            summaryCards: new Map(),
            aiPlayers: [],
        });
        await newGame.save();
        this.gameGateway.emitGameCreated(newGame);
        return newGame;
    }
    async getAvailableGames(page = 1, pageSize = 3) {
        try {
            const skip = (page - 1) * pageSize;
            const availableGames = await this.gameModel
                .find({})
                .skip(skip)
                .limit(pageSize)
                .sort({ createdAt: -1 })
                .exec();
            const totalGames = await this.gameModel.countDocuments({});
            return {
                games: availableGames,
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalGames,
                    totalPages: Math.ceil(totalGames / pageSize),
                    hasNext: skip + pageSize < totalGames,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            console.error('Error getting available games:', error);
            throw error;
        }
    }
    async findGameByUser(owner) {
        const game = await this.gameModel
            .findOne({
            owner,
            isFinished: false,
        })
            .exec();
        if (!game) {
            throw new common_1.NotFoundException(`No active game found for owner '${owner}'`);
        }
        return game;
    }
    async findGameByName(gameName) {
        const game = await this.gameModel.findOne({ gameName }).exec();
        if (!game) {
            throw new common_1.NotFoundException(`Game '${gameName}' not found`);
        }
        return game;
    }
    async getCurrentGame(gameName) {
        return this.findGameByName(gameName);
    }
    async joinGame(gameName, username) {
        const game = await this.findGameByName(gameName);
        this.validateJoinGame(game, username);
        const totalActivePlayers = game.players.length + (game.aiPlayers?.length || 0);
        if (totalActivePlayers >= game.maxPlayers) {
            return await this.replaceAIWithPlayerLogic(game, username);
        }
        if (game.isPrepared && game.currentRound > 0) {
            await this.giveCompensationCards(game, username);
        }
        game.players.push(username);
        game.lastActivity = new Date();
        const totalPlayers = game.players.length;
        const maxPlayers = game.maxPlayers;
        if (totalPlayers === maxPlayers && game.isPaused) {
            game.isPaused = false;
            if (game.isFirstTurnOfRound) {
                game.currentPlayerIndex = 0;
            }
        }
        await game.save();
        this.gameGateway.emitPlayerJoined(game, username);
        this.gameGateway.emitGameStateChanged(game);
        return game;
    }
    validateJoinGame(game, username) {
        if (game.isFinished) {
            throw new common_1.BadRequestException('Cannot join a finished game');
        }
        if (game.players.includes(username)) {
            throw new common_1.BadRequestException('Player already in game');
        }
        if (game.isRoundCardRevealed) {
            throw new common_1.BadRequestException('You cannot join the game during the end of a round.' +
                'Wait for the round to end and start a new one.');
        }
        const allPlayers = this.getAllPlayers(game);
        if (game.playersTakenColumn.length === allPlayers.length) {
            throw new common_1.BadRequestException('You cannot join the game while all players are taking columns.' +
                'Wait until the round is over.');
        }
    }
    async giveCompensationCards(game, newPlayer) {
        const roundsPlayed = game.currentRound;
        let cardsPerRound;
        if (game.maxPlayers === 2) {
            cardsPerRound = 1;
        }
        else {
            cardsPerRound = 0.5;
        }
        const compensationCards = Math.floor(roundsPlayed * cardsPerRound);
        const maxCards = 4;
        const cardsToGive = Math.min(compensationCards, maxCards);
        if (cardsToGive <= 0) {
            return;
        }
        const startIndex = Math.max(0, game.deck.length - cardsToGive);
        const cardsTaken = game.deck.splice(startIndex, cardsToGive);
        cardsTaken.forEach((card) => {
            card.isCompensation = true;
        });
        this.addToPlayerCollection(game, newPlayer, cardsTaken);
    }
    addToPlayerCollection(game, player, cards) {
        if (cards.length === 0)
            return;
        if (!game.playerCollections) {
            game.playerCollections = new Map();
        }
        const collections = game.playerCollections;
        const currentCollection = collections.get(player) || [];
        collections.set(player, [...currentCollection, ...cards]);
    }
    async replaceAIWithPlayerLogic(game, username) {
        const aiToReplace = game.aiPlayers[0];
        if (!aiToReplace) {
            throw new common_1.BadRequestException('No AI available to replace');
        }
        const result = await this.aiReplacementService.replaceAIWithPlayer(game.gameName, aiToReplace.name, username);
        if (!result.success || !result.gameState) {
            throw new common_1.BadRequestException(result.message || 'Failed to replace AI');
        }
        return result.gameState;
    }
    async replaceAIWithPlayer(gameName, originalAIName, newPlayerName) {
        return await this.aiReplacementService.replaceAIWithPlayer(gameName, originalAIName, newPlayerName);
    }
    async joinGameWithAIReplacement(gameName, username) {
        return await this.aiReplacementService.joinGameWithAIReplacement(gameName, username);
    }
    async getReplaceableAIs(gameName) {
        return await this.aiReplacementService.getReplaceableAIs(gameName);
    }
    async leaveGame(gameName, username) {
        const game = await this.findGameByName(gameName);
        const allPlayers = this.getAllPlayers(game);
        const currentPlayerBefore = allPlayers[game.currentPlayerIndex];
        const leavingPlayerIndex = allPlayers.indexOf(username);
        if (!game.players.includes(username)) {
            throw new common_1.NotFoundException(`Player '${username}' not found in game`);
        }
        const humanPlayers = game.players.filter((p) => p !== username);
        if (game.isAiEnabled && humanPlayers.length > 0 && !game.isRoundCardRevealed) {
            const wasOwner = game.owner === username;
            const oldOwner = username;
            const result = await this.aiReplacementService.replacePlayerWithAI(gameName, username);
            if (result.success) {
                const gameUpdated = await this.findGameByName(gameName);
                const allPlayersAfter = this.getAllPlayers(gameUpdated);
                if (currentPlayerBefore !== username) {
                    const newIndex = allPlayersAfter.indexOf(currentPlayerBefore);
                    if (newIndex !== -1) {
                        gameUpdated.currentPlayerIndex = newIndex;
                    }
                }
                else {
                    let found = false;
                    for (let i = 0; i < allPlayersAfter.length; i++) {
                        const player = allPlayersAfter[i];
                        if (player && !gameUpdated.playersTakenColumn.includes(player)) {
                            gameUpdated.currentPlayerIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        gameUpdated.currentPlayerIndex = 0;
                    }
                }
                if (wasOwner) {
                    const nextHumanOwner = humanPlayers[0];
                    gameUpdated.owner = nextHumanOwner;
                    this.gameGateway.emitOwnerChanged(gameUpdated, {
                        oldOwner: oldOwner,
                        newOwner: nextHumanOwner,
                        wasOwner: true,
                    });
                }
                await gameUpdated.save();
                this.gameGateway.emitGameStateChanged(gameUpdated);
                this.gameGateway.emitPlayerLeft(gameUpdated, username);
                this.gameGateway.emitGameListUpdated();
                return;
            }
        }
        const playerCards = this.getPlayerCollection(game, username);
        const wildCards = this.getPlayerWildCards(game, username);
        const allCards = [...playerCards, ...wildCards];
        if (!game.isFinished && allCards.length > 0) {
            const columnCards = allCards.filter((card) => card.color.startsWith('green_column') ||
                card.color.startsWith('brown_column'));
            const otherCards = allCards.filter((card) => !columnCards.includes(card));
            if (otherCards.length > 0) {
                game.deck.push(...otherCards);
            }
            for (const card of columnCards) {
                const emptyColumn = game.columns.find((col) => col.cards.length === 0);
                if (emptyColumn) {
                    emptyColumn.cards.push(card);
                }
                else {
                    game.deck.push(card);
                }
            }
        }
        if (allPlayers[game.currentPlayerIndex] === username && !game.isFinished) {
            this.turnPhase.advanceTurn(game);
        }
        game.players = game.players.filter((p) => p !== username);
        game.playersTakenColumn = game.playersTakenColumn.filter((p) => p !== username);
        if (allPlayers[game.currentPlayerIndex] === username) {
            let found = false;
            for (let i = 0; i < this.getAllPlayers(game).length; i++) {
                const player = this.getAllPlayers(game)[i];
                if (player && !game.playersTakenColumn.includes(player)) {
                    game.currentPlayerIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                game.currentPlayerIndex = 0;
            }
        }
        else if (leavingPlayerIndex < game.currentPlayerIndex) {
            game.currentPlayerIndex--;
        }
        if (!game.isFinished) {
            this.cleanupPlayerCollections(game, username);
        }
        if (game.owner === username && game.players.length > 0) {
            const nextOwner = game.players[0];
            game.owner = nextOwner;
        }
        if (game.players.length === 1 && !game.isFinished) {
            game.isPaused = true;
            game.playersTakenColumn = [];
            game.isRoundCardRevealed = false;
            game.isFirstTurnOfRound = true;
        }
        if (game.players.length < game.maxPlayers && !game.isFinished) {
            game.isPaused = true;
        }
        if (game.players.length === 0) {
            game.isAvailable = false;
            game.lastActivity = new Date();
            this.gameGateway.emitGameUnavailable(game);
            setTimeout(async () => {
                try {
                    const freshGame = await this.gameModel.findById(game._id);
                    if (freshGame && freshGame.players.length === 0) {
                        await this.deleteGame(freshGame);
                    }
                }
                catch (error) {
                    console.error('Error deleting empty save file:', error);
                }
            }, 12000);
        }
        await game.save();
        this.gameGateway.emitGameStateChanged(game);
        this.gameGateway.emitPlayerLeft(game, username);
        this.gameGateway.emitGameListUpdated();
        if (game.owner === username) {
            this.gameGateway.emitOwnerChanged(game, {
                oldOwner: username,
                newOwner: game.owner,
                wasOwner: true,
            });
        }
    }
    getPlayerCollection(game, username) {
        if (game.playerCollections instanceof Map) {
            return game.playerCollections.get(username) || [];
        }
        return game.playerCollections?.[username] || [];
    }
    getPlayerWildCards(game, username) {
        if (game.wildCards instanceof Map) {
            return game.wildCards.get(username) || [];
        }
        return game.wildCards?.[username] || [];
    }
    async handlePlayerLeaveInFinishedGame(game, username) {
        game.players = game.players.filter((player) => player !== username);
        await game.save();
        this.gameGateway.emitPlayerLeft(game, username);
    }
    async createAIReplacementForLeavingPlayer(game, leavingPlayer) {
        const remainingPlayers = [
            ...game.players.filter((p) => p !== leavingPlayer),
            ...game.aiPlayers.map((ai) => ai.name),
        ];
        const newAIName = this.aiPreparationService.generateAIPlayerNames(1, remainingPlayers)[0];
        const gameDifficulty = game.difficultyLevel;
        const newAI = {
            name: newAIName,
            difficulty: gameDifficulty,
            strategy: this.determineStrategyForDifficulty(gameDifficulty),
        };
        await this.copyPlayerProgressToAI(game, leavingPlayer, newAIName);
        game.players = game.players.filter((p) => p !== leavingPlayer);
        game.aiPlayers.push(newAI);
        this.updatePlayersTakenColumnForReplacement(game, leavingPlayer, newAIName);
        if (!game.replacedPlayers)
            game.replacedPlayers = new Map();
        game.replacedPlayers.set(newAIName, {
            originalAIName: leavingPlayer,
            replacedBy: newAIName,
            replacedAt: new Date(),
        });
        this.gameGateway.emitToGame(game.gameName, 'player_replaced_by_ai', {
            originalPlayer: leavingPlayer,
            newAI: newAIName,
            game: this.gameGateway.sanitizeGameForEmission(game),
            timestamp: new Date(),
        });
    }
    async copyPlayerProgressToAI(game, playerName, aiName) {
        if (game.playerCollections instanceof Map) {
            const playerCollection = game.playerCollections.get(playerName) || [];
            game.playerCollections.set(aiName, [...playerCollection]);
        }
        else if (game.playerCollections) {
            game.playerCollections[aiName] = game.playerCollections[playerName] || [];
        }
        if (game.wildCards instanceof Map) {
            const playerWildCards = game.wildCards.get(playerName) || [];
            game.wildCards.set(aiName, [...playerWildCards]);
        }
        else if (game.wildCards) {
            game.wildCards[aiName] = game.wildCards[playerName] || [];
        }
        if (game.summaryCards instanceof Map) {
            const playerSummaryCards = game.summaryCards.get(playerName) || [];
            game.summaryCards.set(aiName, [...playerSummaryCards]);
        }
        else if (game.summaryCards) {
            game.summaryCards[aiName] = game.summaryCards[playerName] || [];
        }
    }
    updatePlayersTakenColumnForReplacement(game, oldPlayer, newPlayer) {
        if (game.playersTakenColumn.includes(oldPlayer)) {
            const index = game.playersTakenColumn.indexOf(oldPlayer);
            if (index !== -1) {
                game.playersTakenColumn.splice(index, 1);
                if (!game.playersTakenColumn.includes(newPlayer)) {
                    game.playersTakenColumn.push(newPlayer);
                }
            }
        }
    }
    determineStrategyForDifficulty(difficulty) {
        const strategies = {
            Basic: ['conservative', 'balanced'],
            Expert: ['balanced', 'aggressive'],
        };
        const available = strategies[difficulty];
        return available[Math.floor(Math.random() * available.length)];
    }
    cleanupPlayerCollections(game, username) {
        if (game.playerCollections instanceof Map) {
            game.playerCollections.delete(username);
        }
        else if (game.playerCollections) {
            delete game.playerCollections[username];
        }
        if (game.replacedPlayers instanceof Map) {
            game.replacedPlayers.delete(username);
        }
        else if (game.replacedPlayers) {
            delete game.replacedPlayers[username];
        }
    }
    async deleteGame(game) {
        await this.messagesService.deleteMessagesByGame(game.gameName);
        await this.gameModel.deleteOne({ gameName: game.gameName });
        this.gameGateway.emitGameDeleted(game.gameName);
    }
    emitPlayerLeftEvents(game, username) {
        this.gameGateway.emitPlayerLeft(game, username);
        this.gameGateway.emitToGame(game.gameName, 'playerLeft', {
            username,
            players: game.players,
            currentPlayers: game.players.length,
            newOwner: game.owner,
            aiReplaced: true,
        });
    }
    async selectDifficultyAndPrepareGame(gameName, level) {
        const game = await this.findGameByName(gameName);
        if (game.isPrepared) {
            throw new common_1.BadRequestException('Game is already prepared');
        }
        if (game.players.length < 2) {
            throw new common_1.BadRequestException('Need at least 2 players to start the game');
        }
        game.difficultyLevel = level;
        game.preparationTime = new Date();
        game.lastActivity = new Date();
        await game.save();
        return game;
    }
    async prepareGame(gameName, level) {
        return this.preparationPhase.prepareGame(gameName, level);
    }
    async prepareAIGame(gameName, owner, numberOfAIPlayers, difficulty = 'Basic') {
        return this.aiPreparationService.prepareAIGame(gameName, owner, numberOfAIPlayers, difficulty);
    }
    async createAIGameOnly(gameName, owner, numberOfAIPlayers, difficulty = 'Basic') {
        return this.aiPreparationService.createAIGameOnly(gameName, owner, numberOfAIPlayers, difficulty);
    }
    async getPreparationTimeRemaining(gameName) {
        const game = await this.findGameByName(gameName);
        if (!game.preparationTime) {
            return 0;
        }
        const preparationEndTime = new Date(game.preparationTime);
        preparationEndTime.setMinutes(preparationEndTime.getMinutes() + 5);
        const now = new Date();
        const timeRemaining = preparationEndTime.getTime() - now.getTime();
        return Math.max(0, Math.floor(timeRemaining / 1000));
    }
    async executeAiTurn(gameName, aiPlayerName) {
        let retries = 2;
        while (retries > 0) {
            try {
                const game = await this.findGameByName(gameName);
                if (!game || game.players.length === 0) {
                    return { success: true, message: 'Game deleted, turn skipped' };
                }
                const result = await this.aiPhaseTurnService.executeAITurn(game, aiPlayerName);
                if (game.playersTakenColumn.includes(aiPlayerName)) {
                    const nextPlayer = this.findNextPlayerWithoutColumn(game);
                    if (nextPlayer) {
                        const allPlayers = this.getAllPlayers(game);
                        game.currentPlayerIndex = allPlayers.indexOf(nextPlayer);
                        await game.save();
                        return {
                            success: true,
                            message: `Skipped turn, now: ${nextPlayer}`,
                        };
                    }
                }
                if (result && Array.isArray(result)) {
                    const endRoundAction = result.find((action) => action.action === 'round_end' ||
                        (action.card &&
                            (action.card.isEndRound || action.card.color === 'endRound')));
                    if (endRoundAction) {
                        game.isRoundCardRevealed = true;
                        if (endRoundAction.card) {
                            this.gameGateway.emitCardRevealed(game, endRoundAction.card);
                            this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
                                game: this.gameGateway.sanitizeGameForEmission(game),
                                revealedCard: endRoundAction.card,
                                playerName: aiPlayerName,
                                isAI: true,
                                timestamp: new Date(),
                            });
                        }
                        this.gameGateway.emitGameStateChanged(game);
                    }
                }
                if (this.haveAllPlayersTakenColumn(game)) {
                    await this.handleRoundEnd(gameName);
                    return { success: true, roundEnded: true };
                }
                if (result.length > 0 && result[result.length - 1].updatedGameState) {
                    const lastAction = result[result.length - 1];
                    this.updateGameFromActionResult(game, lastAction.updatedGameState);
                }
                if (result && Array.isArray(result)) {
                    const roundEndActions = result.filter((action) => action.action === 'round_should_end_after_take' ||
                        action.action === 'round_end_forced' ||
                        action.action === 'round_end');
                    if (roundEndActions.length > 0) {
                        await game.save();
                        await this.handleRoundEnd(gameName);
                        return {
                            success: true,
                            roundEnded: true,
                            message: 'Round ended by AI action',
                            result: result,
                        };
                    }
                }
                if (this.haveAllPlayersTakenColumn(game)) {
                    await game.save();
                    await this.handleRoundEnd(gameName);
                    return {
                        success: true,
                        roundEnded: true,
                        message: 'Round ended after AI turn',
                    };
                }
                const endRoundCard = this.findEndRoundCardInColumns(game);
                if (endRoundCard) {
                    this.emitEndRoundCardEvents(game, aiPlayerName, endRoundCard);
                }
                await game.save();
                return result;
            }
            catch (error) {
                if (error.name === 'VersionError') {
                    retries--;
                    if (retries === 0) {
                        throw error;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    continue;
                }
                else {
                    throw error;
                }
            }
        }
    }
    findNextPlayerWithoutColumn(game) {
        const allPlayers = this.getAllPlayers(game);
        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[(game.currentPlayerIndex + i) % allPlayers.length];
            if (!game.playersTakenColumn.includes(player)) {
                return player;
            }
        }
        return null;
    }
    haveAllPlayersTakenColumn(game) {
        const allPlayers = this.getAllPlayers(game);
        return allPlayers.every((player) => game.playersTakenColumn.includes(player));
    }
    updateGameFromActionResult(game, updatedState) {
        game.playersTakenColumn = updatedState.playersTakenColumn || [];
        game.currentPlayerIndex = updatedState.currentPlayerIndex || 0;
        game.columns = updatedState.columns || [];
        game.deck = updatedState.deck || [];
        if (updatedState.playerCollections) {
            game.playerCollections = updatedState.playerCollections;
        }
        if (updatedState.wildCards) {
            game.wildCards = updatedState.wildCards;
        }
    }
    findEndRoundCardInColumns(game) {
        for (const column of game.columns) {
            for (const card of column.cards) {
                if (card.isEndRound || card.color === 'endRound') {
                    return card;
                }
            }
        }
        return null;
    }
    emitEndRoundCardEvents(game, playerName, card) {
        this.gameGateway.emitCardRevealed(game, card);
        this.gameGateway.emitToGame(game.gameName, 'endRoundCardRevealed', {
            game,
            revealedCard: card,
            playerName,
            isAI: true,
        });
    }
    async revealCard(gameName, playerName, columnIndex) {
        const game = await this.findGameByName(gameName);
        const originalDeck = [...game.deck];
        const result = await this.turnPhase.revealCard(game, playerName, columnIndex);
        if (result.success) {
            if (result.card?.color !== 'golden_wild') {
                game.deck = [...originalDeck];
                game.deck.shift();
            }
            try {
                await game.save();
            }
            catch (error) {
                if (error.name === 'VersionError') {
                    const freshGame = await this.findGameByName(gameName);
                    Object.assign(game, freshGame.toObject());
                }
                else {
                    throw error;
                }
            }
            this.emitRevealCardEvents(gameName, game, playerName, result);
        }
        return result;
    }
    emitRevealCardEvents(gameName, game, playerName, result) {
        this.gameGateway.emitCardRevealed(game, result.card);
        if (result.card &&
            (result.card.isEndRound || result.card.color === 'endRound')) {
            this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
                game,
                revealedCard: result.card,
                playerName,
            });
        }
        else if (result.goldenWildAdditionalCard && result.goldenWildEndRound) {
            this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
                game,
                revealedCard: result.goldenWildAdditionalCard,
                playerName,
                viaGoldenWild: true,
            });
        }
    }
    async takeColumn(gameName, playerName, columnIndex) {
        const game = await this.findGameByName(gameName);
        const result = await this.turnPhase.takeColumn(game, playerName, columnIndex);
        if (result.success) {
            await game.save();
            this.emitColumnTakenEvents(gameName, game, columnIndex, playerName);
            if (this.haveAllPlayersTakenColumn(game)) {
                await this.handleRoundEnd(gameName);
                return { ...result, roundEnded: true };
            }
        }
        return result;
    }
    emitColumnTakenEvents(gameName, game, columnIndex, playerName) {
        this.gameGateway.emitColumnTaken(game, columnIndex, playerName);
        this.gameGateway.emitGameStateChanged(game);
        this.gameGateway.emitToGame(gameName, 'columnTaken', {
            columnIndex,
            playerName,
            game: this.gameGateway.sanitizeGameForEmission(game),
        });
    }
    async handleRoundEnd(gameName) {
        const game = await this.findGameByName(gameName);
        if (game.isRoundCardRevealed && game.playersTakenColumn?.length === 0) {
            return;
        }
        this.gameGateway.emitToGame(gameName, 'reassignmentStarting', {
            gameName,
            message: 'End of round. Reassigning column charts...',
            duration: 3000,
            timestamp: new Date(),
            round: game.currentRound,
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let result;
        if (game.aiPlayers.length > 0) {
            result = await this.aiRoundEndPhase.handleAIRoundEnd(game);
            if (result && result.action === 'game_end') {
                return await this.finalizeAndCalculateScores(gameName);
            }
        }
        else {
            result = await this.roundEndPhase.handleRoundEnd(game);
        }
        const updatedGame = await this.findGameByName(gameName);
        if (this.shouldEndGame(updatedGame)) {
            return await this.finalizeAndCalculateScores(gameName);
        }
        this.emitRoundEndCompleteEvents(gameName, updatedGame);
        return result;
    }
    async shouldEndRound(gameName) {
        const game = await this.findGameByName(gameName);
        if (game.isRoundCardRevealed) {
            return true;
        }
        const allPlayers = [
            ...game.players,
            ...game.aiPlayers.map((ai) => ai.name),
        ];
        const allTakenColumn = allPlayers.every((player) => game.playersTakenColumn.includes(player));
        return allTakenColumn || game.deck.length === 0;
    }
    shouldEndGame(game) {
        const allPlayers = this.getAllPlayers(game);
        const condition1 = game.isRoundCardRevealed &&
            allPlayers.every((player) => game.playersTakenColumn.includes(player));
        const condition2 = game.deck.length === 0 &&
            game.columns.every((column) => column.cards.length === 0);
        return condition1 || condition2;
    }
    emitRoundEndCompleteEvents(gameName, game) {
        this.gameGateway.emitToGame(gameName, 'reassignmentComplete', {
            gameName,
            timestamp: new Date(),
            round: game.currentRound,
            game: this.gameGateway.sanitizeGameForEmission(game),
        });
        this.gameGateway.emitGameStateChanged(game);
    }
    async checkAndHandleRoundEnd(gameName) {
        const game = await this.findGameByName(gameName);
        if (game.isRoundCardRevealed) {
            if (this.haveAllPlayersTakenColumn(game)) {
                await this.handleRoundEnd(gameName);
                return true;
            }
            return false;
        }
        if (this.haveAllPlayersTakenColumn(game)) {
            await this.handleRoundEnd(gameName);
            return true;
        }
        return false;
    }
    async finalizeAndCalculateScores(gameName) {
        const game = await this.findGameByName(gameName);
        await game.save();
        const result = await this.gameEndPhase.handleGameEnd(game);
        game.isFinished = true;
        game.finalScores = result.finalScores;
        game.winner = result.winners;
        await game.save();
        for (const player of game.players) {
            const won = result.winners.includes(player);
            await this.userModel.updateOne({ username: player }, {
                $inc: {
                    gamesPlayed: 1,
                    gamesWon: won ? 1 : 0,
                    gamesLost: won ? 0 : 1,
                },
            });
        }
        this.emitGameFinalizedEvents(gameName, game, result);
        return result;
    }
    emitGameFinalizedEvents(gameName, game, result) {
        this.gameGateway.emitGameFinalized(game, result.finalScores, result.winners);
        this.gameGateway.emitGameStateChanged(game);
        this.gameGateway.emitToGame(gameName, 'game_finalized', {
            game: this.gameGateway.sanitizeGameForEmission(game),
            finalScores: result.finalScores,
            winner: result.winners,
            timestamp: new Date(),
        });
    }
    getAllPlayers(game) {
        return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(game_schema_1.Game.name)),
    __param(1, (0, mongoose_2.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        message_service_1.MessagesService,
        game_gateway_1.GameGateway,
        ai_phase_preparation_service_1.AiPhasePreparationService,
        phase_preparation_service_1.PhasePreparationService,
        phase_turn_service_1.PhaseTurnService,
        ai_replacement_service_1.AiReplacementService,
        phase_round_end_service_1.PhaseRoundEndService,
        ai_phase_round_end_service_1.AiPhaseRoundEndService,
        phase_game_end_service_1.PhaseGameEndService,
        ai_phase_turn_service_1.AiPhaseTurnService])
], GameService);
//# sourceMappingURL=game.service.js.map