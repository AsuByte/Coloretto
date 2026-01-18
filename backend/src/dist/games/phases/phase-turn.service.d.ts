import { Game } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';
import { GameGateway } from '@/games/game.gateway';
export declare class PhaseTurnService {
    private gameGateway;
    constructor(gameGateway: GameGateway);
    advanceTurn(gameState: Game): void;
    revealCard(gameState: Game, playerId: string, columnIndex: number): Promise<{
        success: boolean;
        card?: Card;
        roundEnded?: boolean;
        keepTurn?: boolean;
        mustPassTurn?: boolean;
        goldenWildAdditionalCard?: Card;
        goldenWildEndRound?: boolean;
    }>;
    private handleEndRoundCard;
    private handleGoldenWild;
    private canRevealCard;
    takeColumn(gameState: Game, playerId: string, columnIndex: number): Promise<{
        success: boolean;
        takenCards?: Card[];
        wildCards?: Card[];
        normalCards?: Card[];
    }>;
    private canTakeSpecialCase;
    private canTakeColumn;
    private updatePlayerCollection;
    private separateWildCards;
    private getAllPlayers;
}
