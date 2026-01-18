import { Injectable } from '@nestjs/common';
import { AIGameEndResult } from '@/types/interfaces';
import { GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';

@Injectable()
export class AiPhaseGameEndService {
  async handleAIGameEnd(gameState: GameDocument): Promise<AIGameEndResult> {
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
    } catch (error) {
      return this.getErrorResult();
    }
  }

  private cleanupColumns(gameState: GameDocument): void {
    let discardedCards = 0;

    gameState.columns.forEach((column) => {
      if (column.cards.length > 0) {
        discardedCards += column.cards.length;
        column.cards = [];
      }
    });
  }

  private filterColumnCards(gameState: GameDocument): void {
    const allPlayers = this.getAllPlayers(gameState);

    allPlayers.forEach((player) => {
      const playerCollection = this.getPlayerCollection(gameState, player);

      if (playerCollection.length > 0) {
        const filteredCollection = this.removeColumnCards(playerCollection);
        const removedCount =
          playerCollection.length - filteredCollection.length;

        this.updatePlayerCollection(gameState, player, filteredCollection);
      }
    });
  }

  private async calculateFinalScores(
    gameState: GameDocument,
  ): Promise<Record<string, number>> {
    const finalScores: Record<string, number> = {};
    const allPlayers = this.getAllPlayers(gameState);

    for (const player of allPlayers) {
      finalScores[player] = await this.calculatePlayerScore(gameState, player);
    }

    return finalScores;
  }

  private async calculatePlayerScore(
    gameState: GameDocument,
    playerId: string,
  ): Promise<number> {
    const playerCollection = this.getPlayerCollection(gameState, playerId);
    const playerWildCards = this.getPlayerWildCards(gameState, playerId);
    const difficulty = this.getPlayerDifficulty(gameState, playerId);

    const colorCounts = this.countCardsByColor(playerCollection);
    const optimizedColorCounts = this.optimizeWildCardsAssignment(
      colorCounts,
      playerWildCards.length,
    );

    const colorPoints = this.calculateColorPoints(
      optimizedColorCounts,
      difficulty,
    );
    const cottonPoints = this.calculateCottonPoints(playerCollection);
    const negativePoints = this.calculateNegativePoints(optimizedColorCounts);

    const totalScore = Math.max(colorPoints + cottonPoints + negativePoints, 0);

    return totalScore;
  }

  private calculateColorPoints(
    colorCounts: Map<string, number>,
    difficulty: 'Basic' | 'Expert',
  ): number {
    if (colorCounts.size === 0) return 0;

    const sortedColors = Array.from(colorCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const topThreeColors = sortedColors.slice(0, 3);

    return topThreeColors.reduce((points, [color, count]) => {
      const cappedCount = Math.min(count, 6);
      return points + this.getColorPoints(cappedCount, difficulty);
    }, 0);
  }

  private calculateNegativePoints(colorCounts: Map<string, number>): number {
    if (colorCounts.size <= 3) return 0;

    const sortedColors = Array.from(colorCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const excessColors = sortedColors.slice(3);

    return -excessColors.reduce((sum, [, count]) => sum + count, 0);
  }

  private optimizeWildCardsAssignment(
    colorCounts: Map<string, number>,
    wildCardCount: number,
  ): Map<string, number> {
    if (wildCardCount === 0) return new Map(colorCounts);

    const optimizedCounts = new Map(colorCounts);
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let currentIndex = 0;
    for (let i = 0; i < wildCardCount; i++) {
      if (sortedColors.length === 0) break;

      const [bestColor] = sortedColors[currentIndex];
      optimizedCounts.set(bestColor, (optimizedCounts.get(bestColor) || 0) + 1);

      currentIndex = (currentIndex + 1) % sortedColors.length;
    }

    return optimizedCounts;
  }

  private getColorPoints(
    cardCount: number,
    difficulty: 'Basic' | 'Expert',
  ): number {
    const pointsTable = {
      Basic: { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15, 6: 21 },
      Expert: { 1: 1, 2: 4, 3: 8, 4: 7, 5: 6, 6: 5 },
    };

    return pointsTable[difficulty][cardCount] || pointsTable[difficulty][6];
  }

  private calculateCottonPoints(playerCollection: Card[]): number {
    const cottonCards = playerCollection.filter(
      (card) => card.color === 'cotton',
    );
    return cottonCards.length * 2;
  }

  private countCardsByColor(playerCollection: Card[]): Map<string, number> {
    const colorCounts = new Map<string, number>();

    playerCollection.forEach((card) => {
      if (this.isNormalColorCard(card)) {
        colorCounts.set(card.color, (colorCounts.get(card.color) || 0) + 1);
      }
    });

    return colorCounts;
  }

  private isNormalColorCard(card: Card): boolean {
    return (
      card.color &&
      !['wild', 'golden_wild', 'cotton'].includes(card.color) &&
      !card.color.startsWith('green_column') &&
      !card.color.startsWith('brown_column') &&
      !card.color.startsWith('summary')
    );
  }

  private removeColumnCards(playerCollection: Card[]): Card[] {
    return playerCollection.filter(
      (card) =>
        !card.color.startsWith('green_column') &&
        !card.color.startsWith('brown_column'),
    );
  }

  private determineWinners(finalScores: Record<string, number>): string[] {
    if (Object.keys(finalScores).length === 0) return [];

    const maxScore = Math.max(...Object.values(finalScores));
    return Object.keys(finalScores).filter(
      (player) => finalScores[player] === maxScore,
    );
  }

  private async getScoreDetails(
    gameState: GameDocument,
  ): Promise<Record<string, any>> {
    const details: Record<string, any> = {};
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

  private getAIStrategy(gameState: GameDocument, playerId: string): string {
    const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
    if (!aiPlayer) return 'human';

    const playerCollection = this.getPlayerCollection(gameState, playerId);
    const colorCounts = this.countCardsByColor(playerCollection);

    if (colorCounts.size <= 2) return 'aggressive';
    if (colorCounts.size >= 4) return 'conservative';
    return 'balanced';
  }

  private getAllPlayers(gameState: GameDocument): string[] {
    return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
  }

  private getPlayerCollection(
    gameState: GameDocument,
    playerId: string,
  ): Card[] {
    if (gameState.playerCollections instanceof Map) {
      return gameState.playerCollections.get(playerId) || [];
    }
    return gameState.playerCollections?.[playerId] || [];
  }

  private getPlayerWildCards(
    gameState: GameDocument,
    playerId: string,
  ): Card[] {
    if (gameState.wildCards instanceof Map) {
      return gameState.wildCards.get(playerId) || [];
    }
    return gameState.wildCards?.[playerId] || [];
  }

  private getPlayerSummaryCards(
    gameState: GameDocument,
    playerId: string,
  ): Card[] {
    if (gameState.summaryCards instanceof Map) {
      return gameState.summaryCards.get(playerId) || [];
    }
    return gameState.summaryCards?.[playerId] || [];
  }

  private getPlayerDifficulty(
    gameState: GameDocument,
    playerId: string,
  ): 'Basic' | 'Expert' {
    const aiPlayer = gameState.aiPlayers.find((ai) => ai.name === playerId);
    if (aiPlayer) {
      return aiPlayer.difficulty as 'Basic' | 'Expert';
    }
    return (gameState.difficultyLevel as 'Basic' | 'Expert') || 'Basic';
  }

  private updatePlayerCollection(
    gameState: GameDocument,
    playerId: string,
    collection: Card[],
  ): void {
    if (gameState.playerCollections instanceof Map) {
      gameState.playerCollections.set(playerId, collection);
    } else {
      (gameState.playerCollections as Record<string, Card[]>)[playerId] =
        collection;
    }
  }

  private getErrorResult(): AIGameEndResult {
    return {
      action: 'game_end',
      finalScores: {},
      winners: [],
      scoreDetails: {},
    };
  }
}
