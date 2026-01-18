"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseGameEndService = void 0;
const common_1 = require("@nestjs/common");
let PhaseGameEndService = class PhaseGameEndService {
    async handleGameEnd(gameState) {
        try {
            this.cleanupColumns(gameState);
            const finalScores = await this.calculateFinalScores(gameState);
            const winners = this.determineWinners(finalScores);
            gameState.isFinished = true;
            gameState.finalScores = finalScores;
            gameState.winner = winners;
            await gameState.save();
            return {
                success: true,
                finalScores,
                winners,
                scoreDetails: await this.getScoreDetails(gameState),
            };
        }
        catch (error) {
            return this.getErrorResult();
        }
    }
    cleanupColumns(gameState) {
        let discardedCount = 0;
        gameState.columns.forEach((column, index) => {
            if (column.cards.length > 0) {
                discardedCount += column.cards.length;
                column.cards = [];
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
        const playerCollection = this.getFilteredPlayerCollection(gameState, playerId);
        const playerWildCards = this.getPlayerWildCards(gameState, playerId);
        const difficulty = this.getGameDifficulty(gameState);
        const colorCounts = this.countCardsByColor(playerCollection);
        const optimizedColorCounts = this.optimizeWildCardsAssignment(colorCounts, playerWildCards.length);
        const colorPoints = this.calculateColorPoints(optimizedColorCounts, difficulty);
        const cottonPoints = this.calculateCottonPoints(playerCollection);
        const negativePoints = this.calculateNegativePoints(optimizedColorCounts);
        const totalScore = Math.max(colorPoints + cottonPoints + negativePoints, 0);
        return totalScore;
    }
    getFilteredPlayerCollection(gameState, playerId) {
        return this.getPlayerCollection(gameState, playerId).filter((card) => !card.color.startsWith('green_column') &&
            !card.color.startsWith('brown_column') &&
            card.color !== 'endRound' &&
            card.color !== 'summary_brown' &&
            card.color !== 'summary_violet');
    }
    calculateColorPoints(colorCounts, difficulty) {
        if (colorCounts.size === 0)
            return 0;
        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
        const topThreeColors = sortedColors.slice(0, 3);
        return topThreeColors.reduce((points, [color, count]) => {
            const cappedCount = Math.min(count, 6);
            const colorPoints = this.getColorPoints(cappedCount, difficulty);
            return points + colorPoints;
        }, 0);
    }
    calculateNegativePoints(colorCounts) {
        if (colorCounts.size <= 3)
            return 0;
        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
        const excessColors = sortedColors.slice(3);
        return -excessColors.reduce((sum, [color, count]) => {
            return sum + count;
        }, 0);
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
    async getScoreDetails(gameState) {
        const details = {};
        const allPlayers = this.getAllPlayers(gameState);
        for (const player of allPlayers) {
            const playerCollection = this.getPlayerCollection(gameState, player);
            const playerWildCards = this.getPlayerWildCards(gameState, player);
            const colorCounts = this.countCardsByColor(playerCollection);
            const optimizedColorCounts = this.optimizeWildCardsAssignment(colorCounts, playerWildCards.length);
            const sortedColors = Array.from(optimizedColorCounts.entries()).sort((a, b) => b[1] - a[1]);
            const topThreeColors = sortedColors.slice(0, 3);
            const excessColors = sortedColors.slice(3);
            details[player] = {
                totalCards: playerCollection.length,
                colorDistribution: Object.fromEntries(colorCounts),
                optimizedDistribution: Object.fromEntries(optimizedColorCounts),
                topThreeColors,
                excessColors,
                cottonCards: playerCollection.filter((card) => card.color === 'cotton')
                    .length,
                wildCards: playerWildCards.length,
                summaryCard: this.getPlayerSummaryCards(gameState, player)[0]?.color || 'none',
                finalScore: gameState.finalScores?.[player] || 0,
            };
        }
        return details;
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
    determineWinners(finalScores) {
        if (Object.keys(finalScores).length === 0)
            return [];
        const maxScore = Math.max(...Object.values(finalScores));
        return Object.keys(finalScores).filter((player) => finalScores[player] === maxScore);
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
    getGameDifficulty(gameState) {
        return gameState.difficultyLevel || 'Basic';
    }
    getErrorResult() {
        return {
            success: false,
            finalScores: {},
            winners: [],
            scoreDetails: {},
        };
    }
};
exports.PhaseGameEndService = PhaseGameEndService;
exports.PhaseGameEndService = PhaseGameEndService = __decorate([
    (0, common_1.Injectable)()
], PhaseGameEndService);
//# sourceMappingURL=phase-game-end.service.js.map