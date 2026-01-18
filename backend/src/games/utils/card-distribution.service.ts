import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Card } from '@/games/card/card.schema';
import { Game, GameDocument } from '@/games/game.schema';
import { DeckService } from '@/games/utils/deck.service';

@Injectable()
export class CardDistributionService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private readonly deckService: DeckService,
  ) {}
  public async assignInitialCards(
    players: string[],
    gameName: string,
    numberOfPlayers: number,
  ): Promise<Map<string, Card[]>> {
    const playerCollections = new Map<string, Card[]>();

    const chameleonCardsPerPlayer = numberOfPlayers === 2 ? 2 : 1;

    const allColors = [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'brown',
    ];
    const shuffledColors = this.deckService.shuffleArray([...allColors]);

    let colorIndex = 0;

    for (const player of players) {
      const initialCards: Card[] = [];

      for (let i = 0; i < chameleonCardsPerPlayer; i++) {
        if (colorIndex < shuffledColors.length) {
          initialCards.push({
            color: shuffledColors[colorIndex],
            isEndRound: false,
          });
          colorIndex++;
        }
      }

      playerCollections.set(player, initialCards);
    }

    return playerCollections;
  }

  public assignSummaryCards(game: Game): Map<string, Card[]> {
    const summaryCards: Card[] = [];

    if (game.difficultyLevel === 'Basic') {
      summaryCards.push({ color: 'summary_brown', isEndRound: false });
    } else {
      summaryCards.push({ color: 'summary_violet', isEndRound: false });
    }

    const playerNames = [
      ...game.players,
      ...game.aiPlayers.map((ai) => ai.name),
    ];

    const assignedSummaryCards: Map<string, Card[]> = new Map();

    playerNames.forEach((player) => {
      assignedSummaryCards.set(player, [...summaryCards]);
    });

    return assignedSummaryCards;
  }
}
