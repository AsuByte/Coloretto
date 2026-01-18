import { Model } from 'mongoose';
import { Card } from '@/games/card/card.schema';
import { Game, GameDocument } from '@/games/game.schema';
import { DeckService } from '@/games/utils/deck.service';
export declare class CardDistributionService {
    private gameModel;
    private readonly deckService;
    constructor(gameModel: Model<GameDocument>, deckService: DeckService);
    assignInitialCards(players: string[], gameName: string, numberOfPlayers: number): Promise<Map<string, Card[]>>;
    assignSummaryCards(game: Game): Map<string, Card[]>;
}
