"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPhaseGameEndService = void 0;
const common_1 = require("@nestjs/common");
let AiPhaseGameEndService = class AiPhaseGameEndService {
    async handleAIGameEnd(gameState) {
        try {
            this.cleanupColumns(gameState);
            this.filterColumnCards(gameState);
            const finalScores = await this.calculateFinalScores(gameState);
            const winners = this.determineWinners(finalScores);
            const scoreDetails = await this.getScoreDetails(gameState);
            gameState.isFinished = true;
            gameState.finalScores = finalScores;
            gameState.winner = winners;
            await gameState.save();
            return {
                action: 'game_end',
                finalScores,
                winners,
                scoreDetails,
                updatedGameState: gameState,
            };
        }
        catch (error) {
            return this.getErrorResult();
        }
    }
    cleanupColumns(gameState) {
        let discardedCards = 0;
        gameState.columns.forEach((column) => {
            if (column.cards.length > 0) {
                discardedCards += column.cards.length;
                column.cards = [];
            }
        });
    }
    filterColumnCards(gameState) {
        const allPlayers = this.getAllPlayers(gameState);
        allPlayers.forEach((player) => {
            const playerCollection = this.getPlayerCollection(gameState, player);
            if (playerCollection.length > 0) {
                const filteredCollection = this.removeColumnCards(playerCollection);
                const removedCount = playerCollection.length - filteredCollection.length;
                this.updatePlayerCollection(gameState, player, filteredCollection);
            }
        });
    }
    async calculateFinalScores(gameState) {
        const finalScores = {};
        const allPlayers = this.getAllPlayers(gameState);
        for (const player of allPlayers) {
            finalScores[player] = await this.calculatePlayerScore(gameState, player);
        }
        return finalScores;
    }
    async calculatePlayerScore(gameState, playerId) {
        const playerCollection = this.getPlayerCollection(gameState, playerId);
        const playerWildCards = this.getPlayerWildCards(gameState, playerId);
        const difficulty = this.getPlayerDifficulty(gameState, playerId);
        const colorCounts = this.countCardsByColor(playerCollection);
        const optimizedColorCounts = this.optimizeWildCardsAssignment(colorCounts, playerWildCards.length);
        const colorPoints = this.calculateColorPoints(optimizedColorCounts, difficulty);
        const cottonPoints = this.calculateCottonPoints(playerCollection);
        const negativePoints = this.calculateNegativePoints(optimizedColorCounts);
        const totalScore = Math.max(colorPoints + cottonPoints + negativePoints, 0);
        return totalScore;
    }
    calculateColorPoints(colorCounts, difficulty) {
        if (colorCounts.size === 0)
            return 0;
        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
        const topThreeColors = sortedColors.slice(0, 3);
        return topThreeColors.reduce((points, [color, count]) => {
            const cappedCount = Math.min(count, 6);
            return points + this.getColorPoints(cappedCount, difficulty);
        }, 0);
    }
    calculateNegativePoints(colorCounts) {
        if (colorCounts.size <= 3)
            return 0;
        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
        const excessColors = sortedColors.slice(3);
        return -excessColors.reduce((sum, [, count]) => sum + count, 0);
    }
    optimizeWildCardsAssignment(colorCounts, wildCardCount) {
        if (wildCardCount === 0)
            return new Map(colorCounts);
        const optimizedCounts = new Map(colorCounts);
        const sortedColors = Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        let currentIndex = 0;
        for (let i = 0; i < wildCardCount; i++) {
            if (sortedColors.length === 0)
                break;
            const [bestColor] = sortedColors[currentIndex];
            optimizedCounts.set(bestColor, (optimizedCounts.get(bestColor) || 0) + 1);
            currentIndex = (currentIndex + 1) % sortedColors.length;
        }
        return optimizedCounts;
    }
    getColorPoints(cardCount, difficulty) {
        const pointsTable = {
            Basic: { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15, 6: 21 },
            Expert: { 1: 1, 2: 4, 3: 8, 4: 7, 5: 6, 6: 5 },
        };
        return pointsTable[difficulty][cardCount] || pointsTable[difficulty][6];
    }
    calculateCottonPoints(playerCollection) {
        const cottonCards = playerCollection.filter((card) => card.color === 'cotton');
        return cottonCards.length * 2;
    }
    countCardsByColor(playerCollection) {
        const colorCounts = new Map();
        playerCollection.forEach((card) => {
            if (this.isNormalColorCard(card)) {
                colorCounts.set(card.color, (colorCounts.get(card.color) || 0) + 1);
            }
        });
        return colorCounts;
    }
    isNormalColorCard(card) {
        return (card.color &&
            !['wild', 'golden_wild', 'cotton'].includes(card.color) &&
            !card.color.startsWith('green_column') &&
            !card.color.startsWith('brown_column') &&
            !card.color.startsWith('summary'));
    }
    removeColumnCards(playerCollection) {
        return playerCollection.filter((card) => !card.color.startsWith('green_column') &&
            !card.color.startsWith('brown_column'));
    }
    determineWinners(finalScores) {
        if (Object.keys(finalScores).length === 0)
            return [];
        const maxScore = Math.max(...Object.values(finalScores));
        return Object.keys(finalScores).filter((player) => finalScores[player] === maxScore);
    }
    async getScoreDetails(gameState) {
        const details = {};
        const allPlayers = this.getAllPlayers(gameState);
        for (const player of allPlayers) {
            const playerCollection = this.getPlayerCollection(gameState, player);
            const colorCounts = this.countCardsByColor(playerCollection);
            const wildCards = this.getPlayerWildCards(gameState, player);
            const summaryCards = this.getPlayerSummaryCards(gameState, player);
            const sortedColors = Array.from(colorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            details[player] = {
                totalCards: playerCollection.length,
                colorDistribution: Object.fromEntries(colorCounts),
                topColors: sortedColors,
                cottonCards: playerCollection.filter((card) => card.color === 'cotton')
                    .length,
                wildCards: wildCards.length,
                summaryCard: summaryCards[0]?.color || 'none',
                strategy: this.getAIStrategy(gameState, player),
                finalScore: gameState.finalScores?.[player] || 0,
            };
        }
        return details;
    }
    getAIStrategy(gameState, playerId) {
        const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
        if (!aiPlayer)
            return 'human';
        const playerCollection = this.getPlayerCollection(gameState, playerId);
        const colorCounts = this.countCardsByColor(playerCollection);
        if (colorCounts.size <= 2)
            return 'aggressive';
        if (colorCounts.size >= 4)
            return 'conservative';
        return 'balanced';
    }
    getAllPlayers(gameState) {
        return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
    }
    getPlayerCollection(gameState, playerId) {
        if (gameState.playerCollections instanceof Map) {
            return gameState.playerCollections.get(playerId) || [];
        }
        return gameState.playerCollections?.[playerId] || [];
    }
    getPlayerWildCards(gameState, playerId) {
        if (gameState.wildCards instanceof Map) {
            return gameState.wildCards.get(playerId) || [];
        }
        return gameState.wildCards?.[playerId] || [];
    }
    getPlayerSummaryCards(gameState, playerId) {
        if (gameState.summaryCards instanceof Map) {
            return gameState.summaryCards.get(playerId) || [];
        }
        return gameState.summaryCards?.[playerId] || [];
    }
    getPlayerDifficulty(gameState, playerId) {
        const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
        if (aiPlayer) {
            return aiPlayer.difficulty;
        }
        return gameState.difficultyLevel || 'Basic';
    }
    updatePlayerCollection(gameState, playerId, collection) {
        if (gameState.playerCollections instanceof Map) {
            gameState.playerCollections.set(playerId, collection);
        }
        else {
            gameState.playerCollections[playerId] =
                collection;
        }
    }
    getErrorResult() {
        return {
            action: 'game_end',
            finalScores: {},
            winners: [],
            scoreDetails: {},
        };
    }
};
exports.AiPhaseGameEndService = AiPhaseGameEndService;
exports.AiPhaseGameEndService = AiPhaseGameEndService = __decorate([
    (0, common_1.Injectable)()
], AiPhaseGameEndService);
//# sourceMappingURL=ai-phase-game-end.service.js.map