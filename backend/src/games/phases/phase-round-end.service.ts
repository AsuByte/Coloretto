import { Injectable } from '@nestjs/common';
import { GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';

@Injectable()
export class PhaseRoundEndService {
  async handleRoundEnd(gameState: GameDocument): Promise<{
    success: boolean;
    assignedColumns: Map<string, number>;
    nextRound: number;
    isGameEnd?: boolean;
    shouldCalculateScores?: boolean;
  }> {
    try {
      const assignedColumns = await this.assignAutomaticColumns(gameState);
      const isGameEnd = this.shouldEndGame(gameState);
      let nextRound = gameState.currentRound;
      let shouldCalculateScores = false;

      if (!isGameEnd) {
        nextRound = await this.prepareNextRound(gameState);
      } else {
        shouldCalculateScores = true;
      }

      return {
        success: true,
        assignedColumns,
        nextRound,
        isGameEnd,
        shouldCalculateScores,
      };
    } catch (error) {
      return {
        success: false,
        assignedColumns: new Map(),
        nextRound: gameState.currentRound,
        shouldCalculateScores: false,
      };
    }
  }

  private async assignAutomaticColumns(
    gameState: GameDocument,
  ): Promise<Map<string, number>> {
    const assignedColumns = new Map<string, number>();
    const allPlayers = this.getAllPlayers(gameState);
    const playersWithoutColumn = allPlayers.filter(
      (player) => !gameState.playersTakenColumn.includes(player),
    );

    const availableColumns = gameState.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.cards.length > 0);

    let columnIndex = 0;
    for (const player of playersWithoutColumn) {
      if (columnIndex < availableColumns.length) {
        const columnToAssign = availableColumns[columnIndex];
        await this.assignColumnToPlayer(
          gameState,
          player,
          columnToAssign.index,
        );
        assignedColumns.set(player, columnToAssign.index);
        columnIndex++;
      }
    }

    return assignedColumns;
  }

  private async assignColumnToPlayer(
    gameState: GameDocument,
    playerId: string,
    columnIndex: number,
  ): Promise<void> {
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

  private separateWildCards(cards: Card[]): {
    wildCards: Card[];
    normalCards: Card[];
  } {
    const wildCards = cards.filter(
      (card) => card.color === 'wild' || card.color === 'golden_wild',
    );
    const normalCards = cards.filter(
      (card) => !['wild', 'golden_wild'].includes(card.color),
    );
    return { wildCards, normalCards };
  }

  private updatePlayerCollection(
    gameState: GameDocument,
    playerId: string,
    normalCards: Card[],
    wildCards: Card[],
  ): void {
    if (!(gameState.playerCollections instanceof Map)) {
      gameState.playerCollections = new Map(
        Object.entries(gameState.playerCollections || {}),
      );
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

  private async prepareNextRound(gameState: GameDocument): Promise<number> {
    const allPlayers = this.getAllPlayers(gameState);
    await this.reassignColumnCards(gameState);
    const nextPlayerIndex = this.determineNextPlayerIndex(
      gameState,
      allPlayers,
    );

    gameState.playersTakenColumn = [];
    gameState.isRoundCardRevealed = false;
    gameState.currentRound += 1;
    gameState.isFirstTurnOfRound = true;
    gameState.currentPlayerIndex = nextPlayerIndex;
    gameState.lastActivity = new Date();

    await gameState.save();
    return gameState.currentRound;
  }

  private determineNextPlayerIndex(
    gameState: GameDocument,
    allPlayers: string[],
  ): number {
    if (gameState.playersTakenColumn.length > 0) {
      const lastPlayerToTakeColumn =
        gameState.playersTakenColumn[gameState.playersTakenColumn.length - 1];
      const nextPlayerIndex = allPlayers.indexOf(lastPlayerToTakeColumn);
      return nextPlayerIndex !== -1 ? nextPlayerIndex : 0;
    }
    return 0;
  }

  private async reassignColumnCards(gameState: GameDocument): Promise<void> {
    const isTwoPlayerGame = gameState.maxPlayers === 2;
    if (isTwoPlayerGame) {
      return await this.handleTwoPlayerColumnCleanup(gameState);
    }

    await this.handleMultiPlayerColumnReassignment(gameState);
  }

  private async handleMultiPlayerColumnReassignment(
    gameState: GameDocument,
  ): Promise<void> {
    const allBrownColumnCards = this.collectBrownColumnCards(gameState);
    this.reassignBrownCardsToColumns(gameState, allBrownColumnCards);
  }

  private collectBrownColumnCards(gameState: GameDocument): Card[] {
    const allBrownColumnCards: Card[] = [];
    const allPlayers = this.getAllPlayers(gameState);
    gameState.columns.forEach((column) => {
      const brownColumnCards = column.cards.filter((card) =>
        card.color.startsWith('brown_column'),
      );
      const greenColumnCards = column.cards.filter((card) =>
        card.color.startsWith('green_column'),
      );

      allBrownColumnCards.push(...brownColumnCards);
      column.cards = [...greenColumnCards];
    });

    allPlayers.forEach((player) => {
      const playerCollection = this.getPlayerCollection(gameState, player);
      const brownColumnCards = playerCollection.filter((card) =>
        card.color.startsWith('brown_column'),
      );

      if (brownColumnCards.length > 0) {
        allBrownColumnCards.push(...brownColumnCards);
        const remainingCards = playerCollection.filter(
          (card) => !card.color.startsWith('brown_column'),
        );
        this.updatePlayerCollectionInGame(gameState, player, remainingCards);
      }
    });

    return allBrownColumnCards;
  }

  private reassignBrownCardsToColumns(
    gameState: GameDocument,
    brownColumnCards: Card[],
  ): void {
    const totalColumns = gameState.columns.length;

    if (brownColumnCards.length < totalColumns) {
      const missingCards = totalColumns - brownColumnCards.length;

      for (let i = 0; i < missingCards; i++) {
        brownColumnCards.push({
          color: 'brown_column',
          isEndRound: false,
        } as Card);
      }
    }

    let cardIndex = 0;
    for (
      let i = 0;
      i < totalColumns && cardIndex < brownColumnCards.length;
      i++
    ) {
      gameState.columns[i].cards.push(brownColumnCards[cardIndex]);
      cardIndex++;
    }

    let currentColumn = 0;
    while (cardIndex < brownColumnCards.length) {
      if (currentColumn < totalColumns) {
        gameState.columns[currentColumn].cards.push(
          brownColumnCards[cardIndex],
        );
        cardIndex++;
        currentColumn++;
      } else {
        currentColumn = 0;
      }
    }
  }

  private async handleTwoPlayerColumnCleanup(
    gameState: GameDocument,
  ): Promise<void> {
    const allPlayers = this.getAllPlayers(gameState);
    const greenColumnCards = this.collectGreenColumnCards(
      gameState,
      allPlayers,
    );

    if (gameState.currentRound === 1 && gameState.columns.length === 3) {
      gameState.columns.splice(2, 1);
    }

    this.emptyAllColumns(gameState);
    this.reassignGreenColumns(gameState, greenColumnCards);
    this.removeGreenColumnsFromCollections(gameState, allPlayers);
  }

  private collectGreenColumnCards(
    gameState: GameDocument,
    allPlayers: string[],
  ): Array<{ color: string; isEndRound: boolean }> {
    const greenColumnCards: Array<{ color: string; isEndRound: boolean }> = [];

    allPlayers.forEach((player) => {
      const playerCollection = this.getPlayerCollection(gameState, player);
      const greenCards = playerCollection.filter((card) =>
        card.color.startsWith('green_column'),
      );

      greenCards.forEach((card) => {
        greenColumnCards.push({
          color: card.color,
          isEndRound: card.isEndRound || false,
        });
      });
    });

    return greenColumnCards;
  }

  private emptyAllColumns(gameState: GameDocument): void {
    gameState.columns.forEach((column) => {
      column.cards = [];
    });
  }

  private reassignGreenColumns(
    gameState: GameDocument,
    greenColumnCards: Array<{ color: string; isEndRound: boolean }>,
  ): void {
    const expectedGreenColumns = ['green_column_0', 'green_column_1'];

    expectedGreenColumns.forEach((expectedColor, index) => {
      if (index < gameState.columns.length) {
        const cardToAssign = greenColumnCards.find(
          (card) => card.color === expectedColor,
        );

        if (cardToAssign) {
          gameState.columns[index].cards.push(cardToAssign);
        } else {
          gameState.columns[index].cards.push({
            color: expectedColor,
            isEndRound: false,
          });
        }
      }
    });
  }

  private removeGreenColumnsFromCollections(
    gameState: GameDocument,
    allPlayers: string[],
  ): void {
    allPlayers.forEach((player) => {
      const playerCollection = this.getPlayerCollection(gameState, player);
      const remainingCards = playerCollection.filter(
        (card) => !card.color.startsWith('green_column'),
      );
      this.updatePlayerCollectionInGame(gameState, player, remainingCards);
    });
  }

  private getPlayerCollection(
    gameState: GameDocument,
    playerId: string,
  ): Card[] {
    if (gameState.playerCollections instanceof Map) {
      return gameState.playerCollections.get(playerId) || [];
    }
    return (gameState.playerCollections as any)?.[playerId] || [];
  }

  private updatePlayerCollectionInGame(
    gameState: GameDocument,
    playerId: string,
    collection: Card[],
  ): void {
    if (gameState.playerCollections instanceof Map) {
      gameState.playerCollections.set(playerId, collection);
    } else {
      (gameState.playerCollections as any)[playerId] = collection;
    }
  }

  private getAllPlayers(gameState: GameDocument): string[] {
    return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
  }

  private shouldEndGame(gameState: GameDocument): boolean {
    const allPlayers = this.getAllPlayers(gameState);

    const mainCondition =
      gameState.isRoundCardRevealed &&
      allPlayers.every((player) =>
        gameState.playersTakenColumn.includes(player),
      );

    const secondaryCondition =
      gameState.deck.length === 0 &&
      gameState.columns.every((column) => column.cards.length === 0);

    return mainCondition || secondaryCondition;
  }
}
