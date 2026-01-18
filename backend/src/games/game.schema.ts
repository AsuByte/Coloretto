import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Card, CardSchema, Column, ColumnSchema } from '@/games/card/card.schema';

export type GameDocument = Game & Document;

@Schema({ versionKey: '__v' })
export class Game {
  @Prop({ required: true })
  owner: string;

  @Prop({ required: true, maxlength: 30 })
  gameName: string;

  @Prop({ required: true, min: 2, max: 5 })
  maxPlayers: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: true })
  isAiEnabled: boolean;

  @Prop({ type: [String], default: [] })
  players: string[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        difficulty: {
          type: String,
          required: true,
          enum: ['Basic', 'Expert'],
        },
        strategy: {
          type: String,
          required: true,
          enum: ['conservative', 'balanced', 'aggressive'],
          default: 'balanced',
        },
      },
    ],
    default: [],
  })
  aiPlayers: { name: string; difficulty: string; strategy: string }[];

  @Prop({ type: Date, default: Date.now })
  lastActivity: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, required: false })
  preparationTime: Date;

  @Prop({ type: Date, required: false })
  preparationTimeIA: Date;

  @Prop({ required: true, enum: ['Basic', 'Expert'] })
  difficultyLevel: 'Basic' | 'Expert';

  @Prop({ type: Boolean, default: false })
  isPrepared: boolean;

  @Prop({ type: Boolean, default: false })
  isFinished: boolean;

  @Prop({ type: [ColumnSchema], default: [] })
  columns: Column[];

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ default: false })
  isPaused: boolean;

  @Prop({ type: Map, of: [Object] })
  summaryCards: Map<string, Card[]>;

  @Prop({ type: Map, of: [{ type: CardSchema }], default: {} })
  wildCards: Map<string, Card[]>;

  @Prop({ type: [CardSchema], default: [] })
  deck: Card[];

  @Prop({ type: Map, of: [Object] })
  playerCollections: Map<string, Card[]>;

  @Prop({ default: false })
  isRoundCardRevealed: boolean;

  @Prop({ default: false })
  isAnimationBlocking: boolean;

  @Prop({ default: false })
  isFirstTurnOfRound: boolean;

  @Prop({ type: [String], default: [] })
  playersEndRoundRevealed: string[];

  @Prop({ default: 0 })
  currentPlayers: number;

  @Prop({ default: 0 })
  currentPlayerIndex: number;

  @Prop({
    type: Map,
    of: {
      originalAIName: String,
      replacedBy: String,
      replacedAt: Date,
    },
    default: {},
  })
  replacedPlayers: Map<
    string,
    {
      originalAIName: string;
      replacedBy: string;
      replacedAt: Date;
    }
  >;

  @Prop({
    type: Map,
    of: Boolean,
    default: {},
  })
  aiReplaceable: Map<string, boolean>;

  @Prop({ default: 0 })
  currentRound: number;

  @Prop({ type: [String], default: [] })
  playersTakenColumn: string[];

  @Prop({ type: Map, of: Number, default: {} })
  finalScores: Record<string, number>;

  @Prop({ type: [String], default: [] })
  winner: string[];
}

export const GameSchema = SchemaFactory.createForClass(Game);

GameSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
