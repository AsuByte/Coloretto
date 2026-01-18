import { Model } from 'mongoose';
import { GameGateway } from '@/games/game.gateway';
import { GameDocument } from '@/games/game.schema';
import { CardDistributionService } from '@/games/utils/card-distribution.service';
import { DeckService } from '@/games/utils/deck.service';
export declare class PhasePreparationService {
    private gameModel;
    private deckService;
    private distributionService;
    private gameGateway;
    constructor(gameModel: Model<GameDocument>, deckService: DeckService, distributionService: CardDistributionService, gameGateway: GameGateway);
    prepareGame(gameName: string, level: string): Promise<GameDocument>;
    private filterDeckByPlayers;
    private getAllPlayerNames;
    private setupGameState;
    private emitGameEvents;
}
