import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Game, GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';
import { AiPhaseGameEndService } from '@/games/ai/ai-phase-game-end.service';
import { GameGateway } from '@/games/game.gateway';
import { AIRoundEndResult } from '@/types/interfaces';

@Injectable()
export class AiPhaseRoundEndService {
  constructor(
    @Inject(AiPhaseGameEndService)
    private readonly aiGameEndService: AiPhaseGameEndService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async handleAIRoundEnd(gameState: GameDocument): Promise<AIRoundEndResult> {
    if (this.shouldEndGame(gameState)) {
      const gameEndResult =
        await this.aiGameEndService.handleAIGameEnd(gameState);

      return {
        action: 'game_end',
        winners: gameEndResult.winners,
        updatedGameState: gameEndResult.updatedGameState,
      };
    }

    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];
    const allTakenColumn = allPlayers.every((player) =>
      gameState.playersTakenColumn.includes(player),
    );

    if (allTakenColumn && !this.shouldEndGame(gameState)) {
      this.gameGateway.emitToGame(gameState.gameName, 'reassignmentStarting', {
        gameName: gameState.gameName,
        message: 'End of round. Reassigning column charts...',
        duration: 3000,
        timestamp: new Date(),
        round: gameState.currentRound,
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const nextRound = await this.prepareAINextRound(gameState);

      return {
        action: 'round_end',
        nextRound,
        updatedGameState: gameState,
      };
    }
  }

  private async removeLeastValuableGreenColumn(gameState: Game): Promise<void> {
    const greenColumns = gameState.columns
      .map((column, index) => ({
        column,
        index,
        value: this.calculateColumnValue(column),
      }))
      .filter(
        ({ column }) =>
          column.cards.length > 0 &&
          column.cards.some((card) => card.color.startsWith('green_column')),
      );

    if (greenColumns.length > 0) {
      greenColumns.sort((a, b) => a.value - b.value);
      const columnToRemove = greenColumns[0];

      gameState.columns.splice(columnToRemove.index, 1);
    }
  }

  private calculateColumnValue(column: any): number {
    if (column.cards.length === 0) return 0;

    let value = 0;
    column.cards.forEach((card: Card) => {
      if (card.color === 'wild' || card.color === 'golden_wild') value += 5;
      else if (card.color === 'cotton') value += 3;
      else if (card.color.startsWith('green_column')) value += 1;
      else value += 2;
    });

    return value;
  }

  private async reassignColumnCardsAndResetDeck(
    gameState: Game,
  ): Promise<void> {
    const columnCardsFromDeck: Card[] = [];
    const remainingDeck: Card[] = [];

    gameState.deck.forEach((card) => {
      if (
        card.color.startsWith('green_column') ||
        card.color.startsWith('brown_column')
      ) {
        columnCardsFromDeck.push(card);
      } else {
        remainingDeck.push(card);
      }
    });

    const columnCardsFromColumns: Card[] = [];
    gameState.columns.forEach((column) => {
      if (column.cards.length > 0) {
        column.cards.forEach((card) => {
          if (
            card.color.startsWith('green_column') ||
            card.color.startsWith('brown_column')
          ) {
            columnCardsFromColumns.push(card);
          }
        });
        column.cards = [];
      }
    });

    const allColumnCards = [...columnCardsFromDeck, ...columnCardsFromColumns];

    const emptyColumns = gameState.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.cards.length === 0);

    let cardIndex = 0;
    for (const emptyColumn of emptyColumns) {
      if (cardIndex < allColumnCards.length) {
        emptyColumn.column.cards.push(allColumnCards[cardIndex]);
        cardIndex++;
      }
    }

    gameState.deck = [...remainingDeck];
  }

  private async assignAutomaticColumnsToAI(
    gameState: Game,
  ): Promise<Map<string, number>> {
    const assignedColumns = new Map<string, number>();
    const aiPlayersWithoutColumn = gameState.aiPlayers
      .map((ai) => ai.name)
      .filter((aiName) => !gameState.playersTakenColumn.includes(aiName));

    const availableColumns = gameState.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.cards.length > 0);

    let columnIndex = 0;
    for (const aiPlayer of aiPlayersWithoutColumn) {
      if (columnIndex < availableColumns.length) {
        const columnToAssign = availableColumns[columnIndex];
        await this.assignColumnToAIPlayer(
          gameState,
          aiPlayer,
          columnToAssign.index,
        );
        assignedColumns.set(aiPlayer, columnToAssign.index);
        columnIndex++;
      }
    }

    return assignedColumns;
  }

  private async assignColumnToAIPlayer(
    gameState: Game,
    aiPlayerId: string,
    columnIndex: number,
  ): Promise<void> {
    const column = gameState.columns[columnIndex];
    if (!column || column.cards.length === 0) {
      throw new Error(`Columna ${columnIndex} está vacía`);
    }

    const takenCards = [...column.cards];

    const wildCards = takenCards.filter(
      (card) => card.color === 'wild' || card.color === 'golden_wild',
    );
    const normalCards = takenCards.filter(
      (card) => !['wild', 'golden_wild'].includes(card.color),
    );

    this.updateAIPlayerCollection(
      gameState,
      aiPlayerId,
      normalCards,
      wildCards,
    );

    column.cards = [];

    if (!gameState.playersTakenColumn.includes(aiPlayerId)) {
      gameState.playersTakenColumn.push(aiPlayerId);
    }
  }

  private updateAIPlayerCollection(
    gameState: Game,
    aiPlayerId: string,
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

    const currentCollection = gameState.playerCollections.get(aiPlayerId) || [];
    gameState.playerCollections.set(aiPlayerId, [
      ...currentCollection,
      ...normalCards,
    ]);

    const currentWildCards = gameState.wildCards.get(aiPlayerId) || [];
    gameState.wildCards.set(aiPlayerId, [...currentWildCards, ...wildCards]);
  }

  private async prepareAINextRound(gameState: GameDocument): Promise<number> {
    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    await this.reassignColumnCardsForAI(gameState);

    let discardedCount = 0;
    gameState.columns.forEach((column, index) => {
      if (gameState.maxPlayers === 2) {
        const columnCardsToKeep = column.cards.filter(
          (card) =>
            card.color.startsWith('brown_column') ||
            card.color.startsWith('green_column'),
        );
        const otherCards = column.cards.filter(
          (card) =>
            !card.color.startsWith('brown_column') &&
            !card.color.startsWith('green_column'),
        );

        if (otherCards.length > 0) {
          discardedCount += otherCards.length;
        }

        column.cards = columnCardsToKeep;
      } else {
        const brownColumnCards = column.cards.filter((card) =>
          card.color.startsWith('brown_column'),
        );
        const otherCards = column.cards.filter(
          (card) => !card.color.startsWith('brown_column'),
        );

        if (otherCards.length > 0) {
          discardedCount += otherCards.length;
        }

        column.cards = brownColumnCards;
      }
    });

    let lastPlayerToTakeColumn: string;

    if (gameState.playersTakenColumn.length > 0) {
      lastPlayerToTakeColumn =
        gameState.playersTakenColumn[gameState.playersTakenColumn.length - 1];
    } else {
      lastPlayerToTakeColumn = allPlayers[gameState.currentPlayerIndex];
    }

    const lastPlayerIndex = allPlayers.indexOf(lastPlayerToTakeColumn);
    const nextPlayerIndex = lastPlayerIndex !== -1 ? lastPlayerIndex : 0;

    gameState.playersTakenColumn = [];
    gameState.isFirstTurnOfRound = true;
    gameState.currentRound += 1;

    gameState.currentPlayerIndex = nextPlayerIndex;

    await gameState.save();
    return gameState.currentRound;
  }

  private async reassignColumnCardsForAI(
    gameState: Game,
    actuallyTakenColumns?: number[],
  ): Promise<void> {
    const isTwoPlayerGame = gameState.maxPlayers === 2;

    if (isTwoPlayerGame) {
      return await this.handleTwoPlayerAIColumnCleanup(
        gameState,
        actuallyTakenColumns,
      );
    } else {
      return await this.handleMultiPlayerColumnReassignment(gameState);
    }
  }

  private getPlayerCollection(gameState: Game, playerId: string): Card[] {
    if (gameState.playerCollections instanceof Map) {
      return gameState.playerCollections.get(playerId) || [];
    } else {
      return (gameState.playerCollections as any)?.[playerId] || [];
    }
  }

  private async handleTwoPlayerAIColumnCleanup(
    gameState: Game,
    actuallyTakenColumns?: number[],
  ): Promise<void> {
    if (gameState.currentRound === 1 && gameState.columns.length === 3) {
      const takenColumns = actuallyTakenColumns || [];

      let columnToRemove = -1;
      for (let i = 0; i < 3; i++) {
        if (!takenColumns.includes(i)) {
          columnToRemove = i;
          break;
        }
      }

      if (columnToRemove === -1) {
        columnToRemove = 2;
      }

      const removedGreenColumn = `green_column_${columnToRemove}`;

      gameState.columns.splice(columnToRemove, 1);

      this.removeSpecificGreenColumnFromGame(gameState, removedGreenColumn);
    }

    await this.reassignGreenColumnsIntelligently(gameState);
  }

  private async reassignGreenColumnsIntelligently(
    gameState: Game,
  ): Promise<void> {
    const expectedGreenColumns = [];
    for (let i = 0; i < gameState.columns.length; i++) {
      expectedGreenColumns.push(`green_column_${i}`);
    }

    const allGreenColumnCards: { color: string; isEndRound: boolean }[] = [];
    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    allPlayers.forEach((player) => {
      let playerCollection: Card[] = [];
      if (gameState.playerCollections instanceof Map) {
        playerCollection = gameState.playerCollections.get(player) || [];
      } else {
        playerCollection = (gameState.playerCollections as any)[player] || [];
      }

      const greenCards = playerCollection.filter(
        (card) =>
          card.color.startsWith('green_column') &&
          expectedGreenColumns.includes(card.color),
      );

      greenCards.forEach((card) => {
        allGreenColumnCards.push({
          color: card.color,
          isEndRound: card.isEndRound || false,
        });
      });

      const remainingCards = playerCollection.filter(
        (card) => !card.color.startsWith('green_column'),
      );

      if (gameState.playerCollections instanceof Map) {
        gameState.playerCollections.set(player, remainingCards);
      } else {
        (gameState.playerCollections as any)[player] = remainingCards;
      }
    });

    allGreenColumnCards.forEach((card) => {
      const columnNumber = this.extractColumnNumber(card.color);
      if (columnNumber !== -1 && columnNumber < gameState.columns.length) {
        const hasGreenColumnInTarget = gameState.columns[
          columnNumber
        ].cards.some((c) => c.color.startsWith('green_column'));

        if (!hasGreenColumnInTarget) {
          gameState.columns[columnNumber].cards.push(card);
        } else {
          for (let i = 0; i < gameState.columns.length; i++) {
            const hasAnyGreenColumn = gameState.columns[i].cards.some((c) =>
              c.color.startsWith('green_column'),
            );
            if (!hasAnyGreenColumn) {
              gameState.columns[i].cards.push(card);
              break;
            }
          }
        }
      }
    });

    gameState.columns.forEach((column, columnIndex) => {
      const greenCardsToRemove = column.cards.filter(
        (card) =>
          card.color.startsWith('green_column') &&
          this.extractColumnNumber(card.color) !== columnIndex,
      );

      if (greenCardsToRemove.length > 0) {
        column.cards = column.cards.filter(
          (card) =>
            !card.color.startsWith('green_column') ||
            this.extractColumnNumber(card.color) === columnIndex,
        );
      }
    });

    for (let i = 0; i < gameState.columns.length; i++) {
      const expectedGreenColumn = `green_column_${i}`;
      const greenColumnInCorrectColumn = gameState.columns[i].cards.some(
        (card) => card.color === expectedGreenColumn,
      );

      if (!greenColumnInCorrectColumn) {
        gameState.columns[i].cards.push({
          color: expectedGreenColumn,
          isEndRound: false,
        });
      }
    }
  }

  private removeSpecificGreenColumnFromGame(
    gameState: Game,
    greenColumnToRemove: string,
  ): void {
    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    let totalRemoved = 0;

    allPlayers.forEach((player) => {
      let playerCollection: Card[] = [];

      if (gameState.playerCollections instanceof Map) {
        playerCollection = gameState.playerCollections.get(player) || [];
      } else {
        playerCollection = (gameState.playerCollections as any)[player] || [];
      }

      const remainingCards = playerCollection.filter(
        (card) => card.color !== greenColumnToRemove,
      );

      const removedCount = playerCollection.length - remainingCards.length;
      totalRemoved += removedCount;

      if (gameState.playerCollections instanceof Map) {
        gameState.playerCollections.set(player, remainingCards);
      } else {
        (gameState.playerCollections as any)[player] = remainingCards;
      }
    });

    const remainingDeck: Card[] = [];
    gameState.deck.forEach((card) => {
      if (card.color !== greenColumnToRemove) {
        remainingDeck.push(card);
      } else {
        totalRemoved++;
      }
    });

    gameState.deck = remainingDeck;
  }

  private async reassignRemainingGreenColumnCards(
    gameState: Game,
  ): Promise<void> {
    gameState.columns.forEach((column) => {
      column.cards = column.cards.filter(
        (card) => !card.color.startsWith('green_column'),
      );
    });

    const availableGreenColumns = ['green_column_0', 'green_column_1'];
    const allGreenColumnCards: { color: string; isEndRound: boolean }[] = [];
    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    allPlayers.forEach((player) => {
      let playerCollection: Card[] = [];
      if (gameState.playerCollections instanceof Map) {
        playerCollection = gameState.playerCollections.get(player) || [];
      } else {
        playerCollection = (gameState.playerCollections as any)[player] || [];
      }

      const greenCards = playerCollection.filter(
        (card) =>
          card.color.startsWith('green_column') &&
          availableGreenColumns.includes(card.color),
      );

      greenCards.forEach((card) => {
        allGreenColumnCards.push({
          color: card.color,
          isEndRound: card.isEndRound || false,
        });
      });

      const remainingCards = playerCollection.filter(
        (card) => !card.color.startsWith('green_column'),
      );

      if (gameState.playerCollections instanceof Map) {
        gameState.playerCollections.set(player, remainingCards);
      } else {
        (gameState.playerCollections as any)[player] = remainingCards;
      }
    });

    if (allGreenColumnCards.length > 0 && gameState.columns.length > 0) {
      const assignedCards = new Set<string>();

      allGreenColumnCards.forEach((card) => {
        const columnNumber = this.extractColumnNumber(card.color);

        if (
          columnNumber !== -1 &&
          columnNumber < gameState.columns.length &&
          !assignedCards.has(card.color)
        ) {
          const hasGreenColumn = gameState.columns[columnNumber].cards.some(
            (c) => c.color.startsWith('green_column'),
          );

          if (!hasGreenColumn) {
            gameState.columns[columnNumber].cards.push(card);
            assignedCards.add(card.color);
          }
        }
      });

      const remainingCards = allGreenColumnCards.filter(
        (card) => !assignedCards.has(card.color),
      );

      if (remainingCards.length > 0) {
        let currentColumn = 0;
        remainingCards.forEach((card) => {
          while (
            currentColumn < gameState.columns.length &&
            gameState.columns[currentColumn].cards.some((c) =>
              c.color.startsWith('green_column'),
            )
          ) {
            currentColumn++;
          }

          if (currentColumn < gameState.columns.length) {
            gameState.columns[currentColumn].cards.push(card);
            assignedCards.add(card.color);
            currentColumn++;
          }
        });
      }
    }
  }

  private extractColumnNumber(color: string): number {
    const match = color.match(/green_column_(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }

  private async handleMultiPlayerColumnReassignment(
    gameState: Game,
  ): Promise<void> {
    const allBrownColumnCards: Card[] = [];
    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    gameState.columns.forEach((column) => {
      const brownCardsInColumn = column.cards.filter((card) =>
        card.color.startsWith('brown_column'),
      );

      allBrownColumnCards.push(...brownCardsInColumn);

      column.cards = column.cards.filter(
        (card) => !card.color.startsWith('brown_column'),
      );
    });

    allPlayers.forEach((player) => {
      const playerCollection = this.getPlayerCollection(gameState, player);
      const brownCardsFromPlayer = playerCollection.filter((card) =>
        card.color.startsWith('brown_column'),
      );

      if (brownCardsFromPlayer.length > 0) {
        allBrownColumnCards.push(...brownCardsFromPlayer);

        const remainingCards = playerCollection.filter(
          (card) => !card.color.startsWith('brown_column'),
        );

        if (gameState.playerCollections instanceof Map) {
          gameState.playerCollections.set(player, remainingCards);
        } else {
          gameState.playerCollections = new Map(
            Object.entries(gameState.playerCollections || {}),
          );
          gameState.playerCollections.set(player, remainingCards);
        }
      }
    });

    const brownCardsFromDeck: Card[] = [];
    const remainingDeck: Card[] = [];

    gameState.deck.forEach((card) => {
      if (card.color.startsWith('brown_column')) {
        brownCardsFromDeck.push(card);
      } else {
        remainingDeck.push(card);
      }
    });

    if (brownCardsFromDeck.length > 0) {
      allBrownColumnCards.push(...brownCardsFromDeck);
    }

    let cardIndex = 0;
    const totalColumns = gameState.columns.length;

    for (
      let i = 0;
      i < totalColumns && cardIndex < allBrownColumnCards.length;
      i++
    ) {
      gameState.columns[i].cards.push(allBrownColumnCards[cardIndex]);
      cardIndex++;
    }

    const remainingBrownCards = allBrownColumnCards.slice(cardIndex);
    gameState.deck = [...remainingDeck, ...remainingBrownCards];
  }

  private shouldEndGame(gameState: Game): boolean {
    if (gameState.isFinished) {
      return true;
    }

    const allPlayers = [
      ...gameState.players,
      ...gameState.aiPlayers.map((ai) => ai.name),
    ];

    const condition1 =
      gameState.isRoundCardRevealed &&
      allPlayers.every((player) =>
        gameState.playersTakenColumn.includes(player),
      );

    const condition2 =
      gameState.deck.length === 0 &&
      gameState.columns.every((column) => column.cards.length === 0);

    return condition1 || condition2;
  }
}
