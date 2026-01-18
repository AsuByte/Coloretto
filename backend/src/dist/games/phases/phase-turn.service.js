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
exports.PhaseTurnService = void 0;
const common_1 = require("@nestjs/common");
const game_gateway_1 = require("../game.gateway");
let PhaseTurnService = class PhaseTurnService {
    constructor(gameGateway) {
        this.gameGateway = gameGateway;
    }
    advanceTurn(gameState) {
        const allPlayers = this.getAllPlayers(gameState);
        const allTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
        if (allTakenColumn) {
            return;
        }
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
    }
    async revealCard(gameState, playerId, columnIndex) {
        try {
            if (!this.canRevealCard(gameState, playerId, columnIndex)) {
                return { success: false };
            }
            if (gameState.deck.length === 0) {
                return { success: false };
            }
            const card = gameState.deck.shift();
            if (!card) {
                return { success: false };
            }
            let mustPassTurn = false;
            if (card.isEndRound) {
                return this.handleEndRoundCard(gameState, playerId, card);
            }
            if (gameState.playersEndRoundRevealed?.includes(playerId)) {
                mustPassTurn = true;
                gameState.playersEndRoundRevealed =
                    gameState.playersEndRoundRevealed.filter((p) => p !== playerId);
            }
            if (gameState.isFirstTurnOfRound) {
                mustPassTurn = true;
                gameState.isFirstTurnOfRound = false;
            }
            gameState.columns[columnIndex].cards.push(card);
            let goldenWildAdditionalCard;
            let goldenWildEndRound = false;
            if (card.color === 'golden_wild') {
                const additionalResult = await this.handleGoldenWild(gameState, columnIndex);
                if (additionalResult.success && additionalResult.card) {
                    goldenWildAdditionalCard = additionalResult.card;
                    goldenWildEndRound = additionalResult.isEndRound || false;
                }
            }
            if (mustPassTurn) {
                this.advanceTurn(gameState);
            }
            gameState.lastActivity = new Date();
            return {
                success: true,
                card,
                roundEnded: false,
                mustPassTurn,
                goldenWildAdditionalCard,
                goldenWildEndRound,
            };
        }
        catch (error) {
            return { success: false };
        }
    }
    handleEndRoundCard(gameState, playerId, card) {
        gameState.isRoundCardRevealed = true;
        this.gameGateway.emitRoundEndCardRevealed(gameState, playerId, card);
        this.gameGateway.emitToGame(gameState.gameName, 'round_end_card_revealed', {
            game: gameState,
            revealedCard: card,
            playerName: playerId,
            isAI: false,
            timestamp: new Date(),
        });
        if (!gameState.playersEndRoundRevealed) {
            gameState.playersEndRoundRevealed = [];
        }
        gameState.playersEndRoundRevealed.push(playerId);
        gameState.lastActivity = new Date();
        return {
            success: true,
            card,
            roundEnded: true,
            mustPassTurn: false,
            keepTurn: true,
        };
    }
    async handleGoldenWild(gameState, columnIndex) {
        try {
            if (gameState.deck.length === 0) {
                return { success: false };
            }
            const additionalCard = gameState.deck.shift();
            gameState.columns[columnIndex].cards.push(additionalCard);
            if (additionalCard.isEndRound || additionalCard.color === 'endRound') {
                gameState.isRoundCardRevealed = true;
                return {
                    success: true,
                    card: additionalCard,
                    isEndRound: true,
                };
            }
            return {
                success: true,
                card: additionalCard,
            };
        }
        catch (error) {
            return { success: false };
        }
    }
    canRevealCard(gameState, playerId, columnIndex) {
        const allPlayers = this.getAllPlayers(gameState);
        if (allPlayers[gameState.currentPlayerIndex] !== playerId) {
            return false;
        }
        if (gameState.playersTakenColumn.includes(playerId)) {
            return false;
        }
        if (columnIndex < 0 || columnIndex >= gameState.columns.length) {
            return false;
        }
        const column = gameState.columns[columnIndex];
        const chameleonCardsInColumn = column.cards.filter((card) => !card.color.startsWith('green_column') &&
            !card.color.startsWith('brown_column') &&
            !card.isEndRound &&
            card.color !== 'endRound' &&
            card.color !== 'summary_brown' &&
            card.color !== 'summary_violet');
        const hasGoldenWild = chameleonCardsInColumn.some((card) => card.color === 'golden_wild');
        const currentChameleonCount = chameleonCardsInColumn.length;
        if (!hasGoldenWild && currentChameleonCount >= 3) {
            return false;
        }
        if (hasGoldenWild && currentChameleonCount >= 4) {
            return false;
        }
        const hasColumnCard = column.cards.some((card) => card.color.startsWith('green_column') ||
            card.color.startsWith('brown_column'));
        if (column.cards.length === 0 && !hasColumnCard) {
            return false;
        }
        if (gameState.deck.length === 0) {
            return false;
        }
        return true;
    }
    async takeColumn(gameState, playerId, columnIndex) {
        try {
            if (!this.canTakeColumn(gameState, playerId, columnIndex)) {
                return { success: false };
            }
            const allPlayers = this.getAllPlayers(gameState);
            const allTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
            if (allTakenColumn) {
                return { success: false };
            }
            if (allPlayers.length < 2) {
                return {
                    success: false,
                };
            }
            const column = gameState.columns[columnIndex];
            if (!column || column.cards.length === 0) {
                return { success: false };
            }
            const canTakeSpecialCase = this.canTakeSpecialCase(gameState, column);
            if (!canTakeSpecialCase) {
                return { success: false };
            }
            const takenCards = [...column.cards];
            const { wildCards, normalCards } = this.separateWildCards(takenCards);
            this.updatePlayerCollection(gameState, playerId, normalCards, wildCards);
            column.cards = [];
            if (!gameState.playersTakenColumn.includes(playerId)) {
                gameState.playersTakenColumn.push(playerId);
            }
            this.advanceTurn(gameState);
            gameState.lastActivity = new Date();
            return {
                success: true,
                takenCards,
                wildCards,
                normalCards,
            };
        }
        catch (error) {
            return { success: false };
        }
    }
    canTakeSpecialCase(gameState, column) {
        const onlyGreenCardsInGame = gameState.columns.every((col) => col.cards.length === 0 ||
            col.cards.every((card) => card.color.startsWith('green_column')));
        const isEndOfGame = gameState.isRoundCardRevealed || gameState.deck.length === 0;
        if (onlyGreenCardsInGame && isEndOfGame) {
            return true;
        }
        const onlyGreenCardsInColumn = column.cards.every((card) => card.color.startsWith('green_column'));
        return !onlyGreenCardsInColumn;
    }
    canTakeColumn(gameState, playerId, columnIndex) {
        const allPlayers = this.getAllPlayers(gameState);
        if (allPlayers[gameState.currentPlayerIndex] !== playerId) {
            return false;
        }
        if (gameState.playersTakenColumn.includes(playerId)) {
            return false;
        }
        if (gameState.isFirstTurnOfRound) {
            return false;
        }
        if (columnIndex < 0 || columnIndex >= gameState.columns.length) {
            return false;
        }
        if (gameState.isFirstTurnOfRound && gameState.currentRound >= 2) {
            return false;
        }
        const column = gameState.columns[columnIndex];
        if (!column || column.cards.length === 0) {
            return false;
        }
        const allPlayersTakenColumn = allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
        if (gameState.isRoundCardRevealed && allPlayersTakenColumn) {
            return false;
        }
        return true;
    }
    updatePlayerCollection(gameState, playerId, normalCards, wildCards) {
        if (!gameState.playerCollections) {
            gameState.playerCollections = new Map();
        }
        if (!gameState.wildCards) {
            gameState.wildCards = new Map();
        }
        const currentCollection = gameState.playerCollections.get(playerId) || [];
        gameState.playerCollections.set(playerId, [
            ...currentCollection,
            ...normalCards,
        ]);
        const currentWildCards = gameState.wildCards.get(playerId) || [];
        gameState.wildCards.set(playerId, [...currentWildCards, ...wildCards]);
    }
    separateWildCards(cards) {
        const wildCards = cards.filter((card) => card.color === 'wild' || card.color === 'golden_wild');
        const normalCards = cards.filter((card) => !['wild', 'golden_wild'].includes(card.color));
        return { wildCards, normalCards };
    }
    getAllPlayers(gameState) {
        return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
    }
};
exports.PhaseTurnService = PhaseTurnService;
exports.PhaseTurnService = PhaseTurnService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [game_gateway_1.GameGateway])
], PhaseTurnService);
//# sourceMappingURL=phase-turn.service.js.map