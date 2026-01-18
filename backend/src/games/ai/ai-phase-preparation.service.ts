import { Model } from 'mongoose';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '@/games/game.schema';
import { GameGateway } from '@/games/game.gateway';

@Injectable()
export class AiPhasePreparationService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async prepareAIGame(
    gameName: string,
    owner: string,
    numberOfAIPlayers: number,
    difficulty: 'Basic' | 'Expert' = 'Basic',
  ): Promise<GameDocument> {
    const game = await this.gameModel.findOne({ gameName }).exec();
    if (!game) {
      throw new Error(`Partida ${gameName} no encontrada`);
    }

    const aiPlayers = this.configureAIPlayers(
      numberOfAIPlayers,
      difficulty,
      game.players,
    );
    game.aiPlayers = aiPlayers;

    const totalPlayers = game.players.length + numberOfAIPlayers;
    if (totalPlayers > game.maxPlayers) {
      game.maxPlayers = totalPlayers;
    }

    await game.save();
    this.emitGameEvents(game);

    return game;
  }

  private configureAIPlayers(
    count: number,
    difficulty: 'Basic' | 'Expert',
    existingPlayers: string[],
  ): any[] {
    const aiNames = this.generateAIPlayerNames(count, existingPlayers);

    return aiNames.map((name) => ({
      name,
      difficulty,
      strategy: this.determineStrategy(difficulty),
      hasTakenColumn: false,
      cardsTakenThisRound: 0,
      isAI: true,
    }));
  }

  public generateAIPlayerNames(
    count: number,
    existingPlayers: string[],
  ): string[] {
    const baseNames = {
      Basic: [
        'Bot_Noob',
        'Bot_Rookie',
        'Bot_NPC',
        'Bot_Target',
        'Bot_Potato',
        'Bot_Lag',
        'Bot_Plastic',
        'Bot_Tutorial',
        'Bot_Iron',
        'Bot_Minion',
        'Bot_Guest',
        'Bot_Casual',
      ],

      Expert: [
        'Bot_Boss',
        'Bot_Legend',
        'Bot_Hacker',
        'Bot_God',
        'Bot_Smurf',
        'Bot_MVP',
        'Bot_Thunder',
        'Bot_Carry',
        'Bot_Elite',
        'Bot_Big',
        'Bot_Speed',
        'Bot_Pro',
      ],
    };

    const names = baseNames[count === 1 ? 'Basic' : 'Expert'];
    const usedNames = new Set([...existingPlayers]);
    const availableNames = names.filter((name) => !usedNames.has(name));
    const shuffled = this.shuffleArray([...availableNames]);

    return shuffled
      .slice(0, count)
      .map((name, index) => (count > 1 ? `${name}_${index + 1}` : name));
  }

  public determineStrategy(
    difficulty: 'Basic' | 'Expert',
  ): 'conservative' | 'balanced' | 'aggressive' {
    const strategies = {
      Basic: ['conservative', 'balanced'] as const,
      Expert: ['balanced', 'aggressive'] as const,
    };

    const available = strategies[difficulty];
    return available[Math.floor(Math.random() * available.length)];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async createAIGameOnly(
    gameName: string,
    owner: string,
    numberOfAIPlayers: number,
    difficulty: 'Basic' | 'Expert' = 'Basic',
  ): Promise<GameDocument> {
    const aiPlayers = this.configureAIPlayers(numberOfAIPlayers, difficulty, [
      owner,
    ]);

    const now = new Date();
    const preparationTimeIA = new Date(now.getTime() + 14000);

    const newGame = new this.gameModel({
      gameName,
      owner,
      players: [owner],
      maxPlayers: numberOfAIPlayers + 1,
      difficultyLevel: difficulty,
      isPrepared: false,
      preparationTimeIA: preparationTimeIA,
      currentRound: 0,
      currentPlayerIndex: 0,
      columns: [],
      deck: [],
      playerCollections: new Map(),
      summaryCards: new Map(),
      aiPlayers,
      isAvailable: true,
      isFinished: false,
      isRoundCardRevealed: false,
      playersTakenColumn: [],
    });

    await newGame.save();

    this.gameGateway.emitGameCreated(newGame);
    this.gameGateway.emitGameListUpdated();
    return newGame;
  }

  private emitGameEvents(game: GameDocument): void {
    this.gameGateway.emitPreparationStarted(game);
    this.gameGateway.emitGamePrepared(game);
    this.gameGateway.emitCardsAssigned(game);
  }
}
