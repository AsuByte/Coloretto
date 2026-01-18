import { AIGameEndResult } from '@/types/interfaces';
import { GameDocument } from '@/games/game.schema';
export declare class AiPhaseGameEndService {
    handleAIGameEnd(gameState: GameDocument): Promise<AIGameEndResult>;
    private cleanupColumns;
    private filterColumnCards;
    private calculateFinalScores;
    private calculatePlayerScore;
    private calculateColorPoints;
    private calculateNegativePoints;
    private optimizeWildCardsAssignment;
    private getColorPoints;
    private calculateCottonPoints;
    private countCardsByColor;
    private isNormalColorCard;
    private removeColumnCards;
    private determineWinners;
    private getScoreDetails;
    private getAIStrategy;
    private getAllPlayers;
    private getPlayerCollection;
    private getPlayerWildCards;
    private getPlayerSummaryCards;
    private getPlayerDifficulty;
    private updatePlayerCollection;
    private getErrorResult;
}
