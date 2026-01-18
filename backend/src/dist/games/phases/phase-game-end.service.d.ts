import { GameDocument } from '@/games/game.schema';
export declare class PhaseGameEndService {
    handleGameEnd(gameState: GameDocument): Promise<{
        success: boolean;
        finalScores: Record<string, number>;
        winners: string[];
        scoreDetails: Record<string, any>;
    }>;
    private cleanupColumns;
    private calculateFinalScores;
    private calculatePlayerScore;
    private getFilteredPlayerCollection;
    private calculateColorPoints;
    private calculateNegativePoints;
    private optimizeWildCardsAssignment;
    private getScoreDetails;
    private countCardsByColor;
    private isNormalColorCard;
    private getColorPoints;
    private calculateCottonPoints;
    private determineWinners;
    private getAllPlayers;
    private getPlayerCollection;
    private getPlayerWildCards;
    private getPlayerSummaryCards;
    private getGameDifficulty;
    private getErrorResult;
}
