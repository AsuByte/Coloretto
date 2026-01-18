import { Model } from 'mongoose';
import { GameDocument } from '@/games/game.schema';
import { GameGateway } from '@/games/game.gateway';
export declare class AiPhasePreparationService {
    private gameModel;
    private gameGateway;
    constructor(gameModel: Model<GameDocument>, gameGateway: GameGateway);
    prepareAIGame(gameName: string, owner: string, numberOfAIPlayers: number, difficulty?: 'Basic' | 'Expert'): Promise<GameDocument>;
    private configureAIPlayers;
    generateAIPlayerNames(count: number, existingPlayers: string[]): string[];
    determineStrategy(difficulty: 'Basic' | 'Expert'): 'conservative' | 'balanced' | 'aggressive';
    private shuffleArray;
    createAIGameOnly(gameName: string, owner: string, numberOfAIPlayers: number, difficulty?: 'Basic' | 'Expert'): Promise<GameDocument>;
    private emitGameEvents;
}
