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
var AiPhaseTurnService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPhaseTurnService = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const game_schema_1 = require("../game.schema");
const ai_strategy_service_1 = require("./ai-strategy.service");
const ai_phase_round_end_service_1 = require("./ai-phase-round-end.service");
const ai_phase_game_end_service_1 = require("./ai-phase-game-end.service");
const game_gateway_1 = require("../game.gateway");
let AiPhaseTurnService = AiPhaseTurnService_1 = class AiPhaseTurnService {
    constructor(gameModel, aiStrategy, aiRoundEndService, aiGameEndService, gameGateway) {
        this.gameModel = gameModel;
        this.aiStrategy = aiStrategy;
        this.aiRoundEndService = aiRoundEndService;
        this.aiGameEndService = aiGameEndService;
        this.gameGateway = gameGateway;
        this.MAX_REVEAL_ACTIONS = 5;
        this.ACTION_DELAY = 2000;
    }
    async shouldEndRound(gameState) {
        const onlyGreenColumnsLeft = gameState.columns.some((column) => column.cards.length > 0 &&
            column.cards.every((card) => card.color.startsWith('green_column')));
        const cannotRevealMore = !this.canRevealCard(gameState);
        if (onlyGreenColumnsLeft && cannotRevealMore) {
            return true;
        }
        const allColumnsFull = gameState.columns.every((column) => column.cards.length >= 3);
        if (allColumnsFull) {
            return true;
        }
        if (gameState.deck.length === 0) {
            return true;
        }
        const allPlayers = [
            ...gameState.players,
            ...gameState.aiPlayers.map((ai) => ai.name),
        ];
        const allPlayersTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
        if (allPlayersTakenColumn) {
            return true;
        }
        return false;
    }
    static recordRoundEndCard(gameId) {
        this.recentRoundEndTimestamps.set(gameId, Date.now());
        setTimeout(() => {
            this.recentRoundEndTimestamps.delete(gameId);
        }, 5000);
    }
    async executeAITurn(gameState, playerId) {
        const allPlayers = [
            ...gameState.players,
            ...gameState.aiPlayers.map((ai) => ai.name),
        ];
        const allTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
        const actions = [];
        const gameId = gameState._id.toString();
        const lastRoundEndTime = AiPhaseTurnService_1.recentRoundEndTimestamps.get(gameId);
        if (lastRoundEndTime && Date.now() - lastRoundEndTime < 3000) {
            actions.push({
                action: 'blocked',
                reason: 'recent_round_end_card',
                updatedGameState: gameState,
            });
            return actions;
        }
        if (allTakenColumn) {
            actions.push({
                action: 'skip_all_took_column',
                reason: 'round_should_end',
                updatedGameState: gameState,
            });
            return actions;
        }
        if (gameState.isFinished) {
            actions.push({
                action: 'game_already_ended',
                reason: 'El juego ya ha terminado',
                updatedGameState: gameState,
            });
            return actions;
        }
        if (await this.shouldEndGame(gameState)) {
            const gameEndResult = await this.aiGameEndService.handleAIGameEnd(gameState);
            gameState.isFinished = true;
            actions.push({
                action: 'game_end_detected',
                details: gameEndResult,
                updatedGameState: gameState,
            });
            return actions;
        }
        if (await this.shouldEndRound(gameState)) {
            if (!gameState.playersTakenColumn.includes(playerId)) {
                const takeResult = await this.executeTakeColumn(gameState, playerId);
                actions.push(takeResult);
                actions.push({
                    action: 'round_should_end_after_take',
                    updatedGameState: gameState,
                });
                return actions;
            }
            const roundEndResult = await this.aiRoundEndService.handleAIRoundEnd(gameState);
            actions.push({
                action: 'round_end_forced',
                details: roundEndResult,
                updatedGameState: gameState,
            });
            return actions;
        }
        const playerExists = allPlayers.includes(playerId);
        if (!playerExists || !this.isValidTurn(gameState, playerId)) {
            actions.push({ action: 'invalid_turn' });
            return actions;
        }
        let actionsTaken = 0;
        let currentGameState = gameState;
        while (actionsTaken < this.MAX_REVEAL_ACTIONS) {
            if (currentGameState.isFirstTurnOfRound &&
                currentGameState.currentRound >= 2) {
                if (actionsTaken >= 1) {
                    currentGameState.isFirstTurnOfRound = false;
                    this.advanceTurn(currentGameState);
                    actions.push({
                        action: 'first_turn_completed',
                        updatedGameState: currentGameState,
                    });
                    return actions;
                }
                const revealResult = await this.executeRevealCard(currentGameState, playerId);
                if (revealResult.updatedGameState) {
                    currentGameState = revealResult.updatedGameState;
                }
                if (revealResult.action === 'round_end') {
                    return actions;
                }
                if (revealResult.action === 'continue_turn') {
                    currentGameState = revealResult.updatedGameState || currentGameState;
                    actionsTaken++;
                    continue;
                }
                currentGameState.isFirstTurnOfRound = false;
                this.advanceTurn(currentGameState);
                actions.push({
                    action: 'first_turn_skipped',
                    updatedGameState: currentGameState,
                });
                return actions;
            }
            if (currentGameState.isFirstTurnOfRound && actionsTaken >= 1) {
                currentGameState.isFirstTurnOfRound = false;
                this.advanceTurn(currentGameState);
            }
            if (!this.canRevealCard(currentGameState)) {
                const forceTakeResult = await this.forceTakeColumn(currentGameState, playerId);
                actions.push(forceTakeResult);
                return actions;
            }
            const action = this.aiStrategy.decideAction(currentGameState, playerId, actionsTaken);
            if ((await action) === 'take_column') {
                const takeResult = await this.executeTakeColumn(currentGameState, playerId);
                actions.push(takeResult);
                return actions;
            }
            const revealResult = await this.executeRevealCard(currentGameState, playerId);
            if (revealResult.action === 'round_end') {
                return actions;
            }
            if (revealResult.action === 'continue_turn') {
                currentGameState = revealResult.updatedGameState || currentGameState;
                actionsTaken++;
                await this.delay(this.ACTION_DELAY);
                continue;
            }
            const takeResult = await this.executeTakeColumn(currentGameState, playerId);
            actions.push(takeResult);
            return actions;
        }
        const takeResult = await this.executeTakeColumn(currentGameState, playerId);
        actions.push(takeResult);
        return actions;
    }
    isValidTurn(gameState, playerId) {
        const allPlayers = [
            ...gameState.players,
            ...gameState.aiPlayers.map((ai) => ai.name),
        ];
        const currentPlayerId = allPlayers[gameState.currentPlayerIndex];
        if (currentPlayerId !== playerId) {
            return false;
        }
        if (gameState.playersTakenColumn.includes(playerId)) {
            return false;
        }
        if (gameState.isFinished) {
            return false;
        }
        if (!gameState.isPrepared) {
            return false;
        }
        return true;
    }
    canRevealCard(gameState) {
        if (!gameState.columns || !Array.isArray(gameState.columns)) {
            return false;
        }
        return gameState.columns.some((column) => {
            if (!column || !column.cards) {
                return false;
            }
            const hasColumnCard = column.cards.some((card) => card.color.startsWith('green_column') ||
                card.color.startsWith('brown_column'));
            if (!hasColumnCard) {
                return false;
            }
            const chameleonCardCount = column.cards.filter((card) => !card.color.startsWith('green_column') &&
                !card.color.startsWith('brown_column')).length;
            if (chameleonCardCount >= 3) {
                return false;
            }
            if (column.cards.length === 0) {
                return false;
            }
            return true;
        });
    }
    async executeRevealCard(gameState, playerId) {
        try {
            const gameId = gameState._id.toString();
            const lastRoundEndTime = AiPhaseTurnService_1.recentRoundEndTimestamps.get(gameId);
            if (lastRoundEndTime && Date.now() - lastRoundEndTime < 3000) {
                return {
                    action: 'blocked',
                    reason: 'recent_round_end_card',
                    updatedGameState: gameState,
                };
            }
            if (gameState.deck.length === 0) {
                return { action: 'error', reason: 'empty_deck' };
            }
            const card = gameState.deck.shift();
            let mustPassTurn = false;
            if (card.isEndRound) {
                gameState.isRoundCardRevealed = true;
                if (!gameState.playersEndRoundRevealed) {
                    gameState.playersEndRoundRevealed = [];
                }
                gameState.playersEndRoundRevealed.push(playerId);
                this.gameGateway.emitRoundEndCardRevealed(gameState, playerId, card);
                this.gameGateway.emitToGame(gameState.gameName, 'round_end_card_revealed', {
                    game: gameState,
                    revealedCard: card,
                    playerName: playerId,
                    isAI: true,
                    timestamp: new Date(),
                });
                this.gameGateway.emitAIRoundEndCard(gameState, playerId, card);
                gameState.lastActivity = new Date();
                return {
                    action: 'end_round_revealed',
                    card: card,
                    updatedGameState: gameState,
                    reason: 'round_end_card_revealed_one_more_allowed',
                };
            }
            const columnIndex = this.aiStrategy.chooseColumnForReveal(gameState, card);
            if (columnIndex === -1) {
                return { action: 'error', reason: 'no_available_columns' };
            }
            gameState.columns[columnIndex].cards.push(card);
            this.gameGateway.emitCardRevealed(gameState, card);
            this.gameGateway.emitToGame(gameState.gameName, 'ai_card_revealed', {
                game: this.gameGateway.sanitizeGameForEmission(gameState),
                revealedCard: card,
                playerName: playerId,
                columnIndex: columnIndex,
                isAI: true,
                timestamp: new Date(),
            });
            try {
                await gameState.save();
            }
            catch (error) {
                if (error.name === 'VersionError') {
                }
                else {
                    throw error;
                }
            }
            let additionalAction = null;
            if (card.color === 'golden_wild') {
                additionalAction = await this.handleGoldenWild(gameState, columnIndex);
            }
            gameState.lastActivity = new Date();
            if (mustPassTurn) {
                this.advanceTurn(gameState);
            }
            return {
                action: mustPassTurn ? 'pass_turn_after_extra' : 'continue_turn',
                card: card,
                columnIndex: columnIndex,
                additionalAction: additionalAction,
                updatedGameState: gameState,
                reason: mustPassTurn ? 'extra_revelation_after_round_end' : undefined,
            };
        }
        catch (error) {
            return { action: 'error', reason: 'execution_failed' };
        }
    }
    async handleGoldenWild(gameState, columnIndex) {
        if (gameState.deck.length === 0) {
            return { action: 'no_additional_card', reason: 'empty_deck' };
        }
        const additionalCard = gameState.deck.shift();
        if (gameState.columns[columnIndex].cards.length < 3) {
            gameState.columns[columnIndex].cards.push(additionalCard);
            this.gameGateway.emitCardRevealed(gameState, additionalCard);
            this.gameGateway.emitToGame(gameState.gameName, 'ai_card_revealed', {
                game: this.gameGateway.sanitizeGameForEmission(gameState),
                revealedCard: additionalCard,
                playerName: 'system_golden_wild',
                columnIndex: columnIndex,
                isAI: true,
                isGolden: true,
                timestamp: new Date(),
            });
            if (additionalCard.isEndRound || additionalCard.color === 'endRound') {
                gameState.isRoundCardRevealed = true;
                this.gameGateway.emitRoundEndCardRevealed(gameState, 'system_golden_wild', additionalCard);
                this.gameGateway.emitToGame(gameState.gameName, 'endRoundCardRevealed', {
                    game: gameState,
                    revealedCard: additionalCard,
                    playerName: 'system_golden_wild',
                    isAI: true,
                    isGolden: true,
                });
                this.gameGateway.emitToGame(gameState.gameName, 'round_end_card_revealed', {
                    game: gameState,
                    revealedCard: additionalCard,
                    playerName: 'system_golden_wild',
                    isAI: true,
                    isGolden: true,
                });
                return {
                    action: 'end_round_revealed',
                    card: additionalCard,
                    updatedGameState: gameState,
                    reason: 'round_end_card_by_golden_wild',
                };
            }
            return {
                action: 'additional_card_revealed',
                card: additionalCard,
                updatedGameState: gameState,
            };
        }
        else {
            return { action: 'no_additional_card', reason: 'column_full' };
        }
    }
    async executeTakeColumn(gameState, playerId) {
        try {
            const gameId = gameState._id.toString();
            const lastRoundEndTime = AiPhaseTurnService_1.recentRoundEndTimestamps.get(gameId);
            if (lastRoundEndTime && Date.now() - lastRoundEndTime < 3000) {
                return {
                    action: 'blocked',
                    reason: 'recent_round_end_card',
                    updatedGameState: gameState,
                };
            }
            const isTwoPlayerGame = gameState.maxPlayers === 2;
            const columnIndex = this.aiStrategy.chooseColumnToTake(gameState, playerId);
            if (columnIndex === -1) {
                return { action: 'error', reason: 'no_takable_columns' };
            }
            const column = gameState.columns[columnIndex];
            if (!column || column.cards.length === 0) {
                return { action: 'error', reason: 'column_unavailable' };
            }
            const isEndOfGame = gameState.isRoundCardRevealed || gameState.deck.length === 0;
            if (!isEndOfGame) {
                if (isTwoPlayerGame) {
                    const onlyGreenCards = column.cards.every((card) => card.color.startsWith('green_column'));
                    if (onlyGreenCards) {
                        return { action: 'error', reason: 'only_green_column_cards' };
                    }
                }
            }
            const takenCards = [...column.cards];
            takenCards.forEach((card) => {
                this.gameGateway.emitCardRevealed(gameState, card);
            });
            await new Promise((resolve) => setTimeout(resolve, 300));
            column.cards = [];
            const wildCards = takenCards.filter((card) => card.color === 'wild' || card.color === 'golden_wild');
            const normalCards = takenCards.filter((card) => !['wild', 'golden_wild'].includes(card.color));
            this.updatePlayerCollection(gameState, playerId, normalCards, wildCards);
            column.cards = [];
            if (!gameState.playersTakenColumn.includes(playerId)) {
                gameState.playersTakenColumn.push(playerId);
            }
            const allPlayers = [
                ...gameState.players,
                ...gameState.aiPlayers.map((ai) => ai.name),
            ];
            const allTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
            if (allTakenColumn) {
                this.gameGateway.emitToGame(gameState.gameName, 'reassignmentStarting', {
                    gameName: gameState.gameName,
                    message: 'End of round. Reassigning column charts...',
                    duration: 3000,
                    timestamp: new Date(),
                    round: gameState.currentRound,
                });
                this.gameGateway.emitGameStateChanged(gameState);
            }
            this.advanceTurn(gameState);
            const freshCheck = await this.gameModel
                .findById(gameState._id, { aiPlayers: 1 })
                .lean();
            const amIStillAlive = freshCheck?.aiPlayers?.some((ai) => ai.name === playerId);
            if (!amIStillAlive) {
                return { action: 'aborted_zombie', reason: 'ai_replaced_during_turn' };
            }
            await gameState.save();
            this.gameGateway.emitColumnTaken(gameState, columnIndex, playerId);
            try {
                await gameState.save();
            }
            catch (error) {
                if (error.name === 'VersionError') {
                }
                else {
                    throw error;
                }
            }
            this.gameGateway.emitToGame(gameState.gameName, 'columnTaken', {
                columnIndex,
                playerName: playerId,
                takenCards: takenCards.map((card) => card.color),
                game: this.gameGateway.sanitizeGameForEmission(gameState),
                timestamp: new Date(),
            });
            this.gameGateway.emitToGame(gameState.gameName, 'gameUpdated', this.gameGateway.sanitizeGameForEmission(gameState));
            gameState.lastActivity = new Date();
            const updatedGameState = {
                ...gameState,
                playersTakenColumn: [...gameState.playersTakenColumn],
                currentPlayerIndex: gameState.currentPlayerIndex,
                columns: [...gameState.columns],
                playerCollections: gameState.playerCollections,
                wildCards: gameState.wildCards,
            };
            return {
                action: 'take_column',
                columnIndex: columnIndex,
                takenCards: takenCards,
                wildCards: wildCards,
                normalCards: normalCards,
                updatedGameState: gameState,
            };
        }
        catch (error) {
            return { action: 'error', reason: 'take_column_failed' };
        }
    }
    advanceTurn(gameState) {
        const allPlayers = [
            ...gameState.players,
            ...gameState.aiPlayers.map((ai) => ai.name),
        ];
        let attempts = 0;
        const maxAttempts = allPlayers.length * 2;
        do {
            gameState.currentPlayerIndex =
                (gameState.currentPlayerIndex + 1) % allPlayers.length;
            attempts++;
            const nextPlayer = allPlayers[gameState.currentPlayerIndex];
            if (gameState.playersTakenColumn.includes(nextPlayer)) {
                continue;
            }
            if (gameState.isRoundCardRevealed) {
                const allTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
                if (allTakenColumn) {
                    break;
                }
            }
            return;
        } while (attempts < maxAttempts);
        gameState.currentPlayerIndex = 0;
    }
    async forceTakeColumn(gameState, playerId) {
        const columnIndex = this.aiStrategy.chooseColumnToTake(gameState, playerId);
        if (columnIndex === -1) {
            return { action: 'pass_turn' };
        }
        return await this.executeTakeColumn(gameState, playerId);
    }
    updatePlayerCollection(gameState, playerId, normalCards, wildCards) {
        if (!(gameState.playerCollections instanceof Map)) {
            gameState.playerCollections = new Map(Object.entries(gameState.playerCollections || {}));
        }
        if (!(gameState.wildCards instanceof Map)) {
            gameState.wildCards = new Map(Object.entries(gameState.wildCards || {}));
        }
        const currentCollection = gameState.playerCollections.get(playerId) || [];
        gameState.playerCollections.set(playerId, [
            ...currentCollection,
            ...normalCards,
        ]);
        const currentWildCards = gameState.wildCards.get(playerId) || [];
        gameState.wildCards.set(playerId, [...currentWildCards, ...wildCards]);
    }
    async shouldEndGame(gameState) {
        if (gameState.isFinished)
            return true;
        const allPlayers = [
            ...gameState.players,
            ...gameState.aiPlayers.map((ai) => ai.name),
        ];
        const conditions = [
            gameState.isRoundCardRevealed &&
                allPlayers.every((player) => gameState.playersTakenColumn.includes(player)),
            gameState.deck.length === 0 &&
                gameState.columns.every((column) => column.cards.length === 0),
        ];
        return conditions.some((condition) => condition);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.AiPhaseTurnService = AiPhaseTurnService;
AiPhaseTurnService.recentRoundEndTimestamps = new Map();
exports.AiPhaseTurnService = AiPhaseTurnService = AiPhaseTurnService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(game_schema_1.Game.name)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ai_strategy_service_1.AiStrategyService,
        ai_phase_round_end_service_1.AiPhaseRoundEndService,
        ai_phase_game_end_service_1.AiPhaseGameEndService,
        game_gateway_1.GameGateway])
], AiPhaseTurnService);
//# sourceMappingURL=ai-phase-turn.service.js.map