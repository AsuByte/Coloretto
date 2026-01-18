import { GameDocument } from '@/games/game.schema';
export declare class PhaseRoundEndService {
    handleRoundEnd(gameState: GameDocument): Promise<{
        success: boolean;
        assignedColumns: Map<string, number>;
        nextRound: number;
        isGameEnd?: boolean;
        shouldCalculateScores?: boolean;
    }>;
    private assignAutomaticColumns;
    private assignColumnToPlayer;
    private separateWildCards;
    private updatePlayerCollection;
    private prepareNextRound;
    private determineNextPlayerIndex;
    private reassignColumnCards;
    private handleMultiPlayerColumnReassignment;
    private collectBrownColumnCards;
    private reassignBrownCardsToColumns;
    private handleTwoPlayerColumnCleanup;
    private collectGreenColumnCards;
    private emptyAllColumns;
    private reassignGreenColumns;
    private removeGreenColumnsFromCollections;
    private getPlayerCollection;
    private updatePlayerCollectionInGame;
    private getAllPlayers;
    private shouldEndGame;
}
