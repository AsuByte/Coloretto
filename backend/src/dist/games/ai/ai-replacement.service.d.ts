import { Model } from 'mongoose';
import { ReplacementResult } from '@/types/interfaces';
import { GameDocument } from '@/games/game.schema';
import { GameGateway } from '@/games/game.gateway';
import { AiPhasePreparationService } from '@/games/ai/ai-phase-preparation.service';
export declare class AiReplacementService {
    private gameModel;
    private preparationAI;
    private gameGateway;
    constructor(gameModel: Model<GameDocument>, preparationAI: AiPhasePreparationService, gameGateway: GameGateway);
    replaceAIWithPlayer(gameName: string, originalAIName: string, newPlayerName: string): Promise<ReplacementResult>;
    replacePlayerWithAI(gameName: string, playerName: string): Promise<ReplacementResult>;
    private validateReplacement;
    private copyAIProgressToPlayer;
    private copyCollection;
    private registerReplacement;
    private updateTurnAfterReplacement;
    private updatePlayersTakenColumn;
    private emitReplacementEvents;
    private getAllPlayers;
    private isPlayerNameTaken;
    getReplaceableAIs(gameName: string): Promise<string[]>;
    canReplaceAI(game: GameDocument, aiName: string): boolean;
    joinGameWithAIReplacement(gameName: string, username: string): Promise<ReplacementResult>;
}
