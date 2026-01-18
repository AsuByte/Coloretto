import { Document, Types } from 'mongoose';
import { Card, Column } from '@/games/card/card.schema';
export type GameDocument = Game & Document;
export declare class Game {
    owner: string;
    gameName: string;
    maxPlayers: number;
    isAvailable: boolean;
    players: string[];
    aiPlayers: {
        name: string;
        difficulty: string;
        strategy: string;
    }[];
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
    preparationTime: Date;
    preparationTimeIA: Date;
    difficultyLevel: 'Basic' | 'Expert';
    isPrepared: boolean;
    isFinished: boolean;
    columns: Column[];
    isPublic: boolean;
    isPaused: boolean;
    summaryCards: Map<string, Card[]>;
    wildCards: Map<string, Card[]>;
    deck: Card[];
    playerCollections: Map<string, Card[]>;
    isRoundCardRevealed: boolean;
    isAnimationBlocking: boolean;
    isFirstTurnOfRound: boolean;
    playersEndRoundRevealed: string[];
    currentPlayers: number;
    currentPlayerIndex: number;
    replacedPlayers: Map<string, {
        originalAIName: string;
        replacedBy: string;
        replacedAt: Date;
    }>;
    aiReplaceable: Map<string, boolean>;
    currentRound: number;
    playersTakenColumn: string[];
    finalScores: Record<string, number>;
    winner: string[];
}
export declare const GameSchema: import("mongoose").Schema<Game, import("mongoose").Model<Game, any, any, any, Document<unknown, any, Game, any, {}> & Game & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Game, Document<unknown, {}, import("mongoose").FlatRecord<Game>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Game> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
