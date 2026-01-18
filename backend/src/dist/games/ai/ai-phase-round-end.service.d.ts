import { GameDocument } from '@/games/game.schema';
import { AiPhaseGameEndService } from '@/games/ai/ai-phase-game-end.service';
import { GameGateway } from '@/games/game.gateway';
import { AIRoundEndResult } from '@/types/interfaces';
export declare class AiPhaseRoundEndService {
    private readonly aiGameEndService;
    private gameGateway;
    constructor(aiGameEndService: AiPhaseGameEndService, gameGateway: GameGateway);
    handleAIRoundEnd(gameState: GameDocument): Promise<AIRoundEndResult>;
    private removeLeastValuableGreenColumn;
    private calculateColumnValue;
    private reassignColumnCardsAndResetDeck;
    private assignAutomaticColumnsToAI;
    private assignColumnToAIPlayer;
    private updateAIPlayerCollection;
    private prepareAINextRound;
    private reassignColumnCardsForAI;
    private getPlayerCollection;
    private handleTwoPlayerAIColumnCleanup;
    private reassignGreenColumnsIntelligently;
    private removeSpecificGreenColumnFromGame;
    private reassignRemainingGreenColumnCards;
    private extractColumnNumber;
    private handleMultiPlayerColumnReassignment;
    private shouldEndGame;
}
