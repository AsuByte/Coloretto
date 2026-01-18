import { Injectable } from '@nestjs/common';
import { GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';

@Injectable()
export class PhaseGameEndService {
  async handleGameEnd(gameState: GameDocument): Promise<{
    success: boolean;
    finalScores: Record<string, number>;
    winners: string[];
    scoreDetails: Record<string, any>;
  }> {
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
    } catch (error) {
      return this.getErrorResult();
    }
  }

  private cleanupColumns(gameState: GameDocument): void {
    let discardedCount = 0;

    gameState.columns.forEach((column, index) => {
      if (column.cards.length > 0) {
        discardedCount += column.cards.length;
        column.cards = [];
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
    const playerCollection = this.getFilteredPlayerCollection(
      gameState,
      playerId,
    );
    const playerWildCards = this.getPlayerWildCards(gameState, playerId);
    const difficulty = this.getGameDifficulty(gameState);

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

  private getFilteredPlayerCollection(
    gameState: GameDocument,
    playerId: string,
  ): Card[] {
    return this.getPlayerCollection(gameState, playerId).filter(
      (card: Card) =>
        !card.color.startsWith('green_column') &&
        !card.color.startsWith('brown_column') &&
        card.color !== 'endRound' &&
        card.color !== 'summary_brown' &&
        card.color !== 'summary_violet',
    );
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
      const colorPoints = this.getColorPoints(cappedCount, difficulty);
      return points + colorPoints;
    }, 0);
  }

  private calculateNegativePoints(colorCounts: Map<string, number>): number {
    if (colorCounts.size <= 3) return 0;

    const sortedColors = Array.from(colorCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const excessColors = sortedColors.slice(3);

    return -excessColors.reduce((sum, [color, count]) => {
      return sum + count;
    }, 0);
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

  private async getScoreDetails(
    gameState: GameDocument,
  ): Promise<Record<string, any>> {
    const details: Record<string, any> = {};
    const allPlayers = this.getAllPlayers(gameState);

    for (const player of allPlayers) {
      const playerCollection = this.getPlayerCollection(gameState, player);
      const playerWildCards = this.getPlayerWildCards(gameState, player);
      const colorCounts = this.countCardsByColor(playerCollection);
      const optimizedColorCounts = this.optimizeWildCardsAssignment(
        colorCounts,
        playerWildCards.length,
      );

      const sortedColors = Array.from(optimizedColorCounts.entries()).sort(
        (a, b) => b[1] - a[1],
      );
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
        summaryCard:
          this.getPlayerSummaryCards(gameState, player)[0]?.color || 'none',
        finalScore: gameState.finalScores?.[player] || 0,
      };
    }

    return details;
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

  private determineWinners(finalScores: Record<string, number>): string[] {
    if (Object.keys(finalScores).length === 0) return [];

    const maxScore = Math.max(...Object.values(finalScores));
    return Object.keys(finalScores).filter(
      (player) => finalScores[player] === maxScore,
    );
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

  private getGameDifficulty(gameState: GameDocument): 'Basic' | 'Expert' {
    return (gameState.difficultyLevel as 'Basic' | 'Expert') || 'Basic';
  }

  private getErrorResult() {
    return {
      success: false,
      finalScores: {},
      winners: [],
      scoreDetails: {},
    };
  }
}
