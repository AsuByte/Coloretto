import { GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';
export declare class AiStrategyService {
    private readonly configs;
    decideAction(gameState: GameDocument, playerId: string, actionsTaken: number): Promise<'reveal' | 'take_column'>;
    private addStrategyDelay;
    private basicDecisionLogic;
    private expertDecisionLogic;
    private evaluateForSummaryCards;
    private analyzeGamePhase;
    private evaluateAllColumns;
    private evaluateColumnForTaking;
    private evaluateColorStrategy;
    private getPlayerStrategy;
    private getPlayerSummaryCards;
    private getPlayerColorStrengths;
    private countAvailableWildCards;
    private extractColorFromSummary;
    private getPlayerCollection;
    private getPlayerDifficulty;
    chooseColumnToTake(gameState: GameDocument, playerId: string): number;
    chooseColumnForReveal(gameState: GameDocument, card: Card): number;
    private evaluateColumnForReveal;
}
