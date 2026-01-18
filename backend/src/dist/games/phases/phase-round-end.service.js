"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseRoundEndService = void 0;
const common_1 = require("@nestjs/common");
let PhaseRoundEndService = class PhaseRoundEndService {
    async handleRoundEnd(gameState) {
        try {
            const assignedColumns = await this.assignAutomaticColumns(gameState);
            const isGameEnd = this.shouldEndGame(gameState);
            let nextRound = gameState.currentRound;
            let shouldCalculateScores = false;
            if (!isGameEnd) {
                nextRound = await this.prepareNextRound(gameState);
            }
            else {
                shouldCalculateScores = true;
            }
            return {
                success: true,
                assignedColumns,
                nextRound,
                isGameEnd,
                shouldCalculateScores,
            };
        }
        catch (error) {
            return {
                success: false,
                assignedColumns: new Map(),
                nextRound: gameState.currentRound,
                shouldCalculateScores: false,
            };
        }
    }
    async assignAutomaticColumns(gameState) {
        const assignedColumns = new Map();
        const allPlayers = this.getAllPlayers(gameState);
        const playersWithoutColumn = allPlayers.filter((player) => !gameState.playersTakenColumn.includes(player));
        const availableColumns = gameState.columns
            .map((column, index) => ({ column, index }))
            .filter(({ column }) => column.cards.length > 0);
        let columnIndex = 0;
        for (const player of playersWithoutColumn) {
            if (columnIndex < availableColumns.length) {
                const columnToAssign = availableColumns[columnIndex];
                await this.assignColumnToPlayer(gameState, player, columnToAssign.index);
                assignedColumns.set(player, columnToAssign.index);
                columnIndex++;
            }
        }
        return assignedColumns;
    }
    async assignColumnToPlayer(gameState, playerId, columnIndex) {
        const column = gameState.columns[columnIndex];
        if (!column || column.cards.length === 0) {
            throw new Error(`Colum ${columnIndex} empty`);
        }
        const takenCards = [...column.cards];
        const { wildCards, normalCards } = this.separateWildCards(takenCards);
        this.updatePlayerCollection(gameState, playerId, normalCards, wildCards);
        column.cards = [];
        if (!gameState.playersTakenColumn.includes(playerId)) {
            gameState.playersTakenColumn.push(playerId);
        }
    }
    separateWildCards(cards) {
        const wildCards = cards.filter((card) => card.color === 'wild' || card.color === 'golden_wild');
        const normalCards = cards.filter((card) => !['wild', 'golden_wild'].includes(card.color));
        return { wildCards, normalCards };
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
    async prepareNextRound(gameState) {
        const allPlayers = this.getAllPlayers(gameState);
        await this.reassignColumnCards(gameState);
        const nextPlayerIndex = this.determineNextPlayerIndex(gameState, allPlayers);
        gameState.playersTakenColumn = [];
        gameState.isRoundCardRevealed = false;
        gameState.currentRound += 1;
        gameState.isFirstTurnOfRound = true;
        gameState.currentPlayerIndex = nextPlayerIndex;
        gameState.lastActivity = new Date();
        await gameState.save();
        return gameState.currentRound;
    }
    determineNextPlayerIndex(gameState, allPlayers) {
        if (gameState.playersTakenColumn.length > 0) {
            const lastPlayerToTakeColumn = gameState.playersTakenColumn[gameState.playersTakenColumn.length - 1];
            const nextPlayerIndex = allPlayers.indexOf(lastPlayerToTakeColumn);
            return nextPlayerIndex !== -1 ? nextPlayerIndex : 0;
        }
        return 0;
    }
    async reassignColumnCards(gameState) {
        const isTwoPlayerGame = gameState.maxPlayers === 2;
        if (isTwoPlayerGame) {
            return await this.handleTwoPlayerColumnCleanup(gameState);
        }
        await this.handleMultiPlayerColumnReassignment(gameState);
    }
    async handleMultiPlayerColumnReassignment(gameState) {
        const allBrownColumnCards = this.collectBrownColumnCards(gameState);
        this.reassignBrownCardsToColumns(gameState, allBrownColumnCards);
    }
    collectBrownColumnCards(gameState) {
        const allBrownColumnCards = [];
        const allPlayers = this.getAllPlayers(gameState);
        gameState.columns.forEach((column) => {
            const brownColumnCards = column.cards.filter((card) => card.color.startsWith('brown_column'));
            const greenColumnCards = column.cards.filter((card) => card.color.startsWith('green_column'));
            allBrownColumnCards.push(...brownColumnCards);
            column.cards = [...greenColumnCards];
        });
        allPlayers.forEach((player) => {
            const playerCollection = this.getPlayerCollection(gameState, player);
            const brownColumnCards = playerCollection.filter((card) => card.color.startsWith('brown_column'));
            if (brownColumnCards.length > 0) {
                allBrownColumnCards.push(...brownColumnCards);
                const remainingCards = playerCollection.filter((card) => !card.color.startsWith('brown_column'));
                this.updatePlayerCollectionInGame(gameState, player, remainingCards);
            }
        });
        return allBrownColumnCards;
    }
    reassignBrownCardsToColumns(gameState, brownColumnCards) {
        const totalColumns = gameState.columns.length;
        if (brownColumnCards.length < totalColumns) {
            const missingCards = totalColumns - brownColumnCards.length;
            for (let i = 0; i < missingCards; i++) {
                brownColumnCards.push({
                    color: 'brown_column',
                    isEndRound: false,
                });
            }
        }
        let cardIndex = 0;
        for (let i = 0; i < totalColumns && cardIndex < brownColumnCards.length; i++) {
            gameState.columns[i].cards.push(brownColumnCards[cardIndex]);
            cardIndex++;
        }
        let currentColumn = 0;
        while (cardIndex < brownColumnCards.length) {
            if (currentColumn < totalColumns) {
                gameState.columns[currentColumn].cards.push(brownColumnCards[cardIndex]);
                cardIndex++;
                currentColumn++;
            }
            else {
                currentColumn = 0;
            }
        }
    }
    async handleTwoPlayerColumnCleanup(gameState) {
        const allPlayers = this.getAllPlayers(gameState);
        const greenColumnCards = this.collectGreenColumnCards(gameState, allPlayers);
        if (gameState.currentRound === 1 && gameState.columns.length === 3) {
            gameState.columns.splice(2, 1);
        }
        this.emptyAllColumns(gameState);
        this.reassignGreenColumns(gameState, greenColumnCards);
        this.removeGreenColumnsFromCollections(gameState, allPlayers);
    }
    collectGreenColumnCards(gameState, allPlayers) {
        const greenColumnCards = [];
        allPlayers.forEach((player) => {
            const playerCollection = this.getPlayerCollection(gameState, player);
            const greenCards = playerCollection.filter((card) => card.color.startsWith('green_column'));
            greenCards.forEach((card) => {
                greenColumnCards.push({
                    color: card.color,
                    isEndRound: card.isEndRound || false,
                });
            });
        });
        return greenColumnCards;
    }
    emptyAllColumns(gameState) {
        gameState.columns.forEach((column) => {
            column.cards = [];
        });
    }
    reassignGreenColumns(gameState, greenColumnCards) {
        const expectedGreenColumns = ['green_column_0', 'green_column_1'];
        expectedGreenColumns.forEach((expectedColor, index) => {
            if (index < gameState.columns.length) {
                const cardToAssign = greenColumnCards.find((card) => card.color === expectedColor);
                if (cardToAssign) {
                    gameState.columns[index].cards.push(cardToAssign);
                }
                else {
                    gameState.columns[index].cards.push({
                        color: expectedColor,
                        isEndRound: false,
                    });
                }
            }
        });
    }
    removeGreenColumnsFromCollections(gameState, allPlayers) {
        allPlayers.forEach((player) => {
            const playerCollection = this.getPlayerCollection(gameState, player);
            const remainingCards = playerCollection.filter((card) => !card.color.startsWith('green_column'));
            this.updatePlayerCollectionInGame(gameState, player, remainingCards);
        });
    }
    getPlayerCollection(gameState, playerId) {
        if (gameState.playerCollections instanceof Map) {
            return gameState.playerCollections.get(playerId) || [];
        }
        return gameState.playerCollections?.[playerId] || [];
    }
    updatePlayerCollectionInGame(gameState, playerId, collection) {
        if (gameState.playerCollections instanceof Map) {
            gameState.playerCollections.set(playerId, collection);
        }
        else {
            gameState.playerCollections[playerId] = collection;
        }
    }
    getAllPlayers(gameState) {
        return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
    }
    shouldEndGame(gameState) {
        const allPlayers = this.getAllPlayers(gameState);
        const mainCondition = gameState.isRoundCardRevealed &&
            allPlayers.every((player) => gameState.playersTakenColumn.includes(player));
        const secondaryCondition = gameState.deck.length === 0 &&
            gameState.columns.every((column) => column.cards.length === 0);
        return mainCondition || secondaryCondition;
    }
};
exports.PhaseRoundEndService = PhaseRoundEndService;
exports.PhaseRoundEndService = PhaseRoundEndService = __decorate([
    (0, common_1.Injectable)()
], PhaseRoundEndService);
//# sourceMappingURL=phase-round-end.service.js.map