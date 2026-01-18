import { Injectable } from '@nestjs/common';
import { Card, Column } from '@/games/card/card.schema';

@Injectable()
export class DeckService {
  public async createDeck(numberOfPlayers: number): Promise<Card[]> {
    const deck: Card[] = [];

    const colors = [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'brown',
    ];

    for (const color of colors) {
      for (let i = 0; i < 9; i++) {
        deck.push({
          color: color,
          isEndRound: false,
        });
      }
    }

    for (let i = 0; i < 10; i++) {
      deck.push({
        color: 'cotton',
        isEndRound: false,
      });
    }

    for (let i = 0; i < 2; i++) {
      deck.push({
        color: 'wild',
        isEndRound: false,
      });
    }

    deck.push({
      color: 'golden_wild',
      isEndRound: false,
    });

    deck.push({
      color: 'endRound',
      isEndRound: true,
    });

    if (numberOfPlayers === 2) {
      deck.push({
        color: 'green_column_0',
        isEndRound: false,
      });
      deck.push({
        color: 'green_column_1',
        isEndRound: false,
      });
      deck.push({
        color: 'green_column_2',
        isEndRound: false,
      });
    } else if (numberOfPlayers >= 3) {
      for (let i = 0; i < numberOfPlayers; i++) {
        deck.push({
          color: 'brown_column',
          isEndRound: false,
        });
      }
    }

    return this.shuffleArray(deck);
  }

  public setupColumnsAndDeck(
    deck: Card[],
    numberOfPlayers: number,
  ): [Column[], Card[]] {
    const shuffledDeck = [...deck];
    let endRoundCard: Card | null = null;
    const columnCards: Card[] = [];
    const normalCards: Card[] = [];

    shuffledDeck.forEach((card) => {
      if (card.isEndRound) {
        endRoundCard = card;
      } else if (
        card.color.startsWith('green_column') ||
        card.color.startsWith('brown_column')
      ) {
        columnCards.push(card);
      } else {
        normalCards.push(card);
      }
    });

    let columns: Column[] = [];

    if (numberOfPlayers === 2) {
      const greenColumn0 = columnCards.find(
        (card) => card.color === 'green_column_0',
      );
      const greenColumn1 = columnCards.find(
        (card) => card.color === 'green_column_1',
      );
      const greenColumn2 = columnCards.find(
        (card) => card.color === 'green_column_2',
      );

      columns = [
        { cards: greenColumn0 ? [greenColumn0] : [] },
        { cards: greenColumn1 ? [greenColumn1] : [] },
        { cards: greenColumn2 ? [greenColumn2] : [] },
      ];
    } else if (numberOfPlayers >= 3) {
      const selectedColumnCards = columnCards.slice(0, numberOfPlayers);
      columns = selectedColumnCards.map((card) => ({
        cards: [card],
      }));
    }

    const deckWithoutColumns = normalCards;

    if (endRoundCard) {
      const endRoundPosition = 15;
      const safePosition = Math.min(
        endRoundPosition,
        deckWithoutColumns.length - 1,
      );

      deckWithoutColumns.splice(safePosition, 0, endRoundCard);
    }

    const finalDeck = [...deckWithoutColumns];

    return [columns, finalDeck];
  }

  public shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public chooseStartingPlayer(players: string[]): number {
    return Math.floor(Math.random() * players.length);
  }

  public getUniqueChameleonColor(): string {
    const allColors = [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'brown',
    ];
    const shuffled = this.shuffleArray([...allColors]);
    return shuffled[0];
  }

  public getUniqueChameleonColors(count: number): string[] {
    const allColors = [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'brown',
    ];
    const shuffled = this.shuffleArray([...allColors]);
    return shuffled.slice(0, Math.min(count, allColors.length));
  }
}
