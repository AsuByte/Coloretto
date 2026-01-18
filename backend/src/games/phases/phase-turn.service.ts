import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Game } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';
import { GameGateway } from '@/games/game.gateway';

@Injectable()
export class PhaseTurnService {
  constructor(
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  public advanceTurn(gameState: Game): void {
    const allPlayers = this.getAllPlayers(gameState);

    const allTakenColumn = allPlayers.every((player) =>
      gameState.playersTakenColumn.includes(player),
    );

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
        const allTakenColumn = allPlayers.every((player) =>
          gameState.playersTakenColumn.includes(player),
        );
        if (allTakenColumn) {
          break;
        }
      }
      return;
    } while (attempts < maxAttempts);
  }

  async revealCard(
    gameState: Game,
    playerId: string,
    columnIndex: number,
  ): Promise<{
    success: boolean;
    card?: Card;
    roundEnded?: boolean;
    keepTurn?: boolean;
    mustPassTurn?: boolean;
    goldenWildAdditionalCard?: Card;
    goldenWildEndRound?: boolean;
  }> {
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

      let goldenWildAdditionalCard: Card | undefined;
      let goldenWildEndRound = false;

      if (card.color === 'golden_wild') {
        const additionalResult = await this.handleGoldenWild(
          gameState,
          columnIndex,
        );
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
    } catch (error) {
      return { success: false };
    }
  }

  private handleEndRoundCard(gameState: Game, playerId: string, card: Card) {
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

  private async handleGoldenWild(
    gameState: Game,
    columnIndex: number,
  ): Promise<{ success: boolean; card?: Card; isEndRound?: boolean }> {
    try {
      if (gameState.deck.length === 0) {
        return { success: false };
      }

      const additionalCard = gameState.deck.shift()!;
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
    } catch (error) {
      return { success: false };
    }
  }

  private canRevealCard(
    gameState: Game,
    playerId: string,
    columnIndex: number,
  ): boolean {
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
    const chameleonCardsInColumn = column.cards.filter(
      (card) =>
        !card.color.startsWith('green_column') &&
        !card.color.startsWith('brown_column') &&
        !card.isEndRound &&
        card.color !== 'endRound' &&
        card.color !== 'summary_brown' &&
        card.color !== 'summary_violet',
    );

    const hasGoldenWild = chameleonCardsInColumn.some(
      (card) => card.color === 'golden_wild',
    );
    const currentChameleonCount = chameleonCardsInColumn.length;

    if (!hasGoldenWild && currentChameleonCount >= 3) {
      return false;
    }

    if (hasGoldenWild && currentChameleonCount >= 4) {
      return false;
    }

    const hasColumnCard = column.cards.some(
      (card) =>
        card.color.startsWith('green_column') ||
        card.color.startsWith('brown_column'),
    );

    if (column.cards.length === 0 && !hasColumnCard) {
      return false;
    }

    if (gameState.deck.length === 0) {
      return false;
    }

    return true;
  }

  async takeColumn(
    gameState: Game,
    playerId: string,
    columnIndex: number,
  ): Promise<{
    success: boolean;
    takenCards?: Card[];
    wildCards?: Card[];
    normalCards?: Card[];
  }> {
    try {
      if (!this.canTakeColumn(gameState, playerId, columnIndex)) {
        return { success: false };
      }

      const allPlayers = this.getAllPlayers(gameState);
      const allTakenColumn = allPlayers.every((player) =>
        gameState.playersTakenColumn.includes(player),
      );

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
    } catch (error) {
      return { success: false };
    }
  }

  private canTakeSpecialCase(gameState: Game, column: any): boolean {
    const onlyGreenCardsInGame = gameState.columns.every(
      (col) =>
        col.cards.length === 0 ||
        col.cards.every((card) => card.color.startsWith('green_column')),
    );

    const isEndOfGame =
      gameState.isRoundCardRevealed || gameState.deck.length === 0;

    if (onlyGreenCardsInGame && isEndOfGame) {
      return true;
    }

    const onlyGreenCardsInColumn = column.cards.every((card) =>
      card.color.startsWith('green_column'),
    );

    return !onlyGreenCardsInColumn;
  }

  private canTakeColumn(
    gameState: Game,
    playerId: string,
    columnIndex: number,
  ): boolean {
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

    const allPlayersTakenColumn = allPlayers.every((player) =>
      gameState.playersTakenColumn.includes(player),
    );

    if (gameState.isRoundCardRevealed && allPlayersTakenColumn) {
      return false;
    }

    return true;
  }

  private updatePlayerCollection(
    gameState: Game,
    playerId: string,
    normalCards: Card[],
    wildCards: Card[],
  ): void {
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

  private getAllPlayers(gameState: Game): string[] {
    return [...gameState.players, ...gameState.aiPlayers.map((ai) => ai.name)];
  }
}
