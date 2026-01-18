"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStrategyService = void 0;
const common_1 = require("@nestjs/common");
let AiStrategyService = class AiStrategyService {
    constructor() {
        this.configs = {
            Basic: {
                minDelay: 1000,
                maxDelay: 2000,
                baseRevealProbability: 70,
                strategicWeight: 0.3,
                colorSpecialization: false,
                maxRevealsBeforeTake: 3,
                patienceFactor: 0.7,
                riskTolerance: 0.3,
            },
            Expert: {
                minDelay: 1500,
                maxDelay: 3000,
                baseRevealProbability: 60,
                strategicWeight: 0.8,
                colorSpecialization: true,
                maxRevealsBeforeTake: 5,
                patienceFactor: 0.4,
                riskTolerance: 0.7,
            },
        };
    }
    async decideAction(gameState, playerId, actionsTaken) {
        const difficulty = this.getPlayerDifficulty(gameState, playerId);
        const config = this.configs[difficulty];
        await this.addStrategyDelay(difficulty);
        const gamePhase = this.analyzeGamePhase(gameState);
        const playerStrategy = this.getPlayerStrategy(gameState, playerId);
        const summaryCards = this.getPlayerSummaryCards(gameState, playerId);
        const playerColors = this.getPlayerColorStrengths(gameState, playerId);
        const columnScores = this.evaluateAllColumns(gameState, playerId, playerColors, summaryCards);
        const bestColumnScore = Math.max(...columnScores.map((c) => c.score));
        const hasHighValueColumn = bestColumnScore > 50;
        let decision;
        if (difficulty === 'Basic') {
            decision = this.basicDecisionLogic(actionsTaken, hasHighValueColumn, gamePhase, config);
        }
        else {
            decision = this.expertDecisionLogic(actionsTaken, hasHighValueColumn, gamePhase, columnScores, playerStrategy, summaryCards, playerColors, config);
        }
        return decision;
    }
    async addStrategyDelay(difficulty) {
        const config = this.configs[difficulty];
        const delay = config.minDelay + Math.random() * (config.maxDelay - config.minDelay);
        if (difficulty === 'Expert') {
            const extraThinkTime = Math.random() * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay + extraThinkTime));
        }
        else {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    basicDecisionLogic(actionsTaken, hasHighValueColumn, gamePhase, config) {
        if (actionsTaken >= config.maxRevealsBeforeTake) {
            return 'take_column';
        }
        if (hasHighValueColumn &&
            actionsTaken >=
                Math.floor(config.maxRevealsBeforeTake * config.patienceFactor)) {
            return Math.random() < 0.7 ? 'take_column' : 'reveal';
        }
        const revealProbability = Math.max(10, config.baseRevealProbability - actionsTaken * 20);
        return Math.random() * 100 < revealProbability ? 'reveal' : 'take_column';
    }
    expertDecisionLogic(actionsTaken, hasHighValueColumn, gamePhase, columnScores, playerStrategy, summaryCards, playerColors, config) {
        const strategyMultiplier = {
            aggressive: 0.7,
            conservative: 1.3,
            balanced: 1.0,
        }[playerStrategy] || 1.0;
        const adjustedMaxReveals = Math.floor(config.maxRevealsBeforeTake * strategyMultiplier);
        if (actionsTaken >= adjustedMaxReveals) {
            return 'take_column';
        }
        if ((gamePhase === 'late' || gamePhase === 'endgame') &&
            config.riskTolerance > 0.5) {
            if (hasHighValueColumn) {
                return 'take_column';
            }
        }
        if (summaryCards.length > 0) {
            const shouldTakeForSummary = this.evaluateForSummaryCards(columnScores, summaryCards, playerColors);
            if (shouldTakeForSummary) {
                return 'take_column';
            }
        }
        const decisionFactors = {
            columnValue: hasHighValueColumn ? 0.3 : 0,
            actionsTaken: Math.min(actionsTaken / adjustedMaxReveals, 0.3),
            gamePhase: gamePhase === 'late' ? 0.2 : 0,
            strategyWeight: config.strategicWeight * 0.2,
            riskTolerance: config.riskTolerance * 0.1,
        };
        const takeProbability = Object.values(decisionFactors).reduce((a, b) => a + b, 0) * 100;
        return Math.random() * 100 < takeProbability ? 'take_column' : 'reveal';
    }
    evaluateForSummaryCards(columnScores, summaryCards, playerColors) {
        for (const summary of summaryCards) {
            const targetColor = this.extractColorFromSummary(summary);
            if (targetColor) {
                const helpfulColumns = columnScores.filter((col) => {
                    return col.score > 40;
                });
                if (helpfulColumns.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    analyzeGamePhase(gameState) {
        const deckPercentage = gameState.deck.length / 80;
        const roundsPlayed = gameState.currentRound;
        if (gameState.isRoundCardRevealed || deckPercentage < 0.1) {
            return 'endgame';
        }
        else if (deckPercentage < 0.4 || roundsPlayed >= 2) {
            return 'late';
        }
        else if (deckPercentage < 0.7 || roundsPlayed >= 1) {
            return 'mid';
        }
        else {
            return 'early';
        }
    }
    evaluateAllColumns(gameState, playerId, playerColors, summaryCards) {
        return gameState.columns.map((column, index) => ({
            index,
            score: this.evaluateColumnForTaking(column, playerId, gameState, playerColors, summaryCards),
        }));
    }
    evaluateColumnForTaking(column, playerId, gameState, playerColors, summaryCards) {
        if (column.cards.length === 0)
            return 0;
        let score = 0;
        const difficulty = this.getPlayerDifficulty(gameState, playerId);
        score += column.cards.length * 8;
        let wildCards = 0;
        let cottonCards = 0;
        let normalColors = new Map();
        column.cards.forEach((card) => {
            if (card.color === 'wild' || card.color === 'golden_wild') {
                wildCards++;
                score += 12;
            }
            else if (card.color === 'cotton') {
                cottonCards++;
                score += 8;
            }
            else if (card.color &&
                !card.color.startsWith('green_column') &&
                !card.color.startsWith('brown_column')) {
                const count = normalColors.get(card.color) || 0;
                normalColors.set(card.color, count + 1);
                score += 5;
            }
        });
        if (difficulty === 'Expert' && playerColors && playerColors.size > 0) {
            score += this.evaluateColorStrategy(column, playerColors, summaryCards || []);
        }
        const hasEndRound = column.cards.some((card) => card.isEndRound);
        if (hasEndRound) {
            score -= 15;
        }
        if (wildCards > 0 && normalColors.size > 0) {
            score += 10;
        }
        const playerCount = gameState.maxPlayers;
        if (playerCount === 2) {
            score *= 1.2;
        }
        return Math.max(0, Math.floor(score));
    }
    evaluateColorStrategy(column, playerColors, summaryCards) {
        let colorScore = 0;
        const columnColors = new Map();
        column.cards.forEach((card) => {
            if (card.color &&
                !['wild', 'golden_wild', 'cotton'].includes(card.color)) {
                const count = columnColors.get(card.color) || 0;
                columnColors.set(card.color, count + 1);
            }
        });
        columnColors.forEach((count, color) => {
            if (playerColors.has(color)) {
                const myCount = playerColors.get(color) || 0;
                const value = Math.max(0, 6 - myCount) * 3;
                colorScore += value * count;
            }
        });
        summaryCards.forEach((summary) => {
            const targetColor = this.extractColorFromSummary(summary);
            if (targetColor && columnColors.has(targetColor)) {
                colorScore += 20;
            }
        });
        return colorScore;
    }
    getPlayerStrategy(gameState, playerId) {
        const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
        return aiPlayer?.strategy || 'balanced';
    }
    getPlayerSummaryCards(gameState, playerId) {
        if (gameState.summaryCards instanceof Map) {
            return gameState.summaryCards.get(playerId) || [];
        }
        return gameState.summaryCards?.[playerId] || [];
    }
    getPlayerColorStrengths(gameState, playerId) {
        const collection = this.getPlayerCollection(gameState, playerId);
        const colors = new Map();
        collection.forEach((card) => {
            if (card.color &&
                !['wild', 'golden_wild', 'cotton'].includes(card.color)) {
                colors.set(card.color, (colors.get(card.color) || 0) + 1);
            }
        });
        return colors;
    }
    countAvailableWildCards(gameState) {
        return gameState.columns.reduce((count, column) => {
            return (count +
                column.cards.filter((card) => card.color === 'wild' || card.color === 'golden_wild').length);
        }, 0);
    }
    extractColorFromSummary(summaryCard) {
        if (summaryCard.color?.startsWith('summary_')) {
            return summaryCard.color.replace('summary_', '');
        }
        return null;
    }
    getPlayerCollection(gameState, playerId) {
        if (gameState.playerCollections instanceof Map) {
            return gameState.playerCollections.get(playerId) || [];
        }
        return gameState.playerCollections?.[playerId] || [];
    }
    getPlayerDifficulty(gameState, playerId) {
        const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
        return aiPlayer?.difficulty || 'Basic';
    }
    chooseColumnToTake(gameState, playerId) {
        const difficulty = this.getPlayerDifficulty(gameState, playerId);
        const playerColors = this.getPlayerColorStrengths(gameState, playerId);
        const summaryCards = this.getPlayerSummaryCards(gameState, playerId);
        const scoredColumns = gameState.columns
            .map((column, index) => ({
            index,
            score: this.evaluateColumnForTaking(column, playerId, gameState, playerColors, summaryCards),
            column,
        }))
            .filter(({ column }) => column.cards.length > 0)
            .sort((a, b) => b.score - a.score);
        if (scoredColumns.length === 0)
            return -1;
        if (difficulty === 'Expert' && scoredColumns[0].score < 30) {
            return -1;
        }
        return scoredColumns[0].index;
    }
    chooseColumnForReveal(gameState, card) {
        const availableColumns = gameState.columns
            .map((column, index) => ({ column, index }))
            .filter(({ column }) => {
            const chameleonCount = column.cards.filter((c) => !c.color.startsWith('green_column') &&
                !c.color.startsWith('brown_column')).length;
            return chameleonCount < 3 && column.cards.length > 0;
        });
        if (availableColumns.length === 0) {
            return -1;
        }
        const scoredColumns = availableColumns
            .map(({ column, index }) => ({
            index,
            score: this.evaluateColumnForReveal(column, card, gameState),
        }))
            .sort((a, b) => b.score - a.score);
        return scoredColumns[0].index;
    }
    evaluateColumnForReveal(column, card, gameState) {
        let score = 0;
        const freeSlots = 3 - column.cards.length;
        score += freeSlots * 15;
        const existingColors = new Set(column.cards
            .filter((c) => !['wild', 'golden_wild', 'cotton'].includes(c.color))
            .map((c) => c.color));
        if (existingColors.size >= 2) {
            score += 10;
        }
        if (card.color && existingColors.has(card.color)) {
            score -= 8;
        }
        if (card.color === 'wild')
            score += 12;
        else if (card.color === 'golden_wild')
            score += 15;
        else if (card.color === 'cotton')
            score += 8;
        else if (card.isEndRound)
            score -= 20;
        return score;
    }
};
exports.AiStrategyService = AiStrategyService;
exports.AiStrategyService = AiStrategyService = __decorate([
    (0, common_1.Injectable)()
], AiStrategyService);
//# sourceMappingURL=ai-strategy.service.js.map