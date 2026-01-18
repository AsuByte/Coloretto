import { Card } from '@/games/card/card.schema';
import { Game, GameDocument } from '@/games/game.schema';
export interface AIGameEndResult {
    action: 'game_end';
    finalScores: Record<string, number>;
    winners: string[];
    scoreDetails: Record<string, any>;
    updatedGameState?: Game;
}
export interface AIPlayerConfig {
    name: string;
    difficulty: 'Basic' | 'Expert';
    strategy: 'conservative' | 'balanced' | 'aggressive';
}
export interface AIRoundEndResult {
    action: 'round_end' | 'game_end' | 'continue';
    reason?: string;
    assignedColumn?: number;
    updatedGameState?: Game;
    nextRound?: number;
    winners?: string[];
}
export interface AITurnResult {
    action: string;
    details?: any;
    reason?: string;
    updatedGameState?: GameDocument;
    card?: Card;
    columnIndex?: number;
    takenCards?: Card[];
    wildCards?: Card[];
    normalCards?: Card[];
    additionalAction?: any;
}
export interface ReplacementResult {
    success: boolean;
    originalAI: string;
    newPlayer: string;
    message: string;
    gameState?: GameDocument;
}
export interface AIDecisionConfig {
    minDelay: number;
    maxDelay: number;
    baseRevealProbability: number;
    strategicWeight: number;
    colorSpecialization: boolean;
    maxRevealsBeforeTake: number;
    patienceFactor: number;
    riskTolerance: number;
}
