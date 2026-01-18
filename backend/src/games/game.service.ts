import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/users/user.schema';
import { MessagesService } from '@/messages/message.service';
import { ReplacementResult } from '@/types/interfaces';
import { Game, GameDocument } from '@/games/game.schema';
import { CreateGameDto } from '@/games/dto/create-game-dto';
import { GameGateway } from '@/games/game.gateway';
import { Card } from '@/games/card/card.schema';
import { PhasePreparationService } from '@/games/phases/phase-preparation.service';
import { AiPhasePreparationService } from '@/games/ai/ai-phase-preparation.service';
import { AiPhaseTurnService } from '@/games/ai/ai-phase-turn.service';
import { PhaseTurnService } from '@/games/phases/phase-turn.service';
import { PhaseRoundEndService } from '@/games/phases/phase-round-end.service';
import { AiPhaseRoundEndService } from '@/games/ai/ai-phase-round-end.service';
import { PhaseGameEndService } from '@/games/phases/phase-game-end.service';
import { AiReplacementService } from '@/games/ai/ai-replacement.service';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly messagesService: MessagesService,
    private readonly gameGateway: GameGateway,
    private readonly aiPreparationService: AiPhasePreparationService,
    private readonly preparationPhase: PhasePreparationService,
    private readonly turnPhase: PhaseTurnService,
    private readonly aiReplacementService: AiReplacementService,
    private readonly roundEndPhase: PhaseRoundEndService,
    private readonly aiRoundEndPhase: AiPhaseRoundEndService,
    private readonly gameEndPhase: PhaseGameEndService,
    private readonly aiPhaseTurnService: AiPhaseTurnService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameDocument> {
    const newGame = new this.gameModel({
      gameName: createGameDto.gameName,
      owner: createGameDto.owner,
      players: [createGameDto.owner],
      maxPlayers: createGameDto.maxPlayers,
      difficultyLevel: createGameDto.difficultyLevel,
      isPrepared: false,
      currentRound: 0,
      currentPlayerIndex: 0,
      columns: [],
      deck: [],
      playerCollections: new Map(),
      summaryCards: new Map(),
      aiPlayers: [],
    });

    await newGame.save();
    this.gameGateway.emitGameCreated(newGame);

    return newGame;
  }

  async getAvailableGames(
    page: number = 1,
    pageSize: number = 3,
  ): Promise<any> {
    try {
      const skip = (page - 1) * pageSize;

      const availableGames = await this.gameModel
        .find({})
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .exec();

      const totalGames = await this.gameModel.countDocuments({});

      return {
        games: availableGames,
        pagination: {
          currentPage: page,
          pageSize,
          totalGames,
          totalPages: Math.ceil(totalGames / pageSize),
          hasNext: skip + pageSize < totalGames,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting available games:', error);
      throw error;
    }
  }

  async findGameByUser(owner: string): Promise<GameDocument> {
    const game = await this.gameModel
      .findOne({
        owner,
        isFinished: false,
      })
      .exec();

    if (!game) {
      throw new NotFoundException(`No active game found for owner '${owner}'`);
    }

    return game;
  }

  async findGameByName(gameName: string): Promise<GameDocument> {
    const game = await this.gameModel.findOne({ gameName }).exec();
    if (!game) {
      throw new NotFoundException(`Game '${gameName}' not found`);
    }
    return game;
  }

  async getCurrentGame(gameName: string): Promise<GameDocument> {
    return this.findGameByName(gameName);
  }

  async joinGame(gameName: string, username: string): Promise<GameDocument> {
    const game = await this.findGameByName(gameName);

    this.validateJoinGame(game, username);

    const totalActivePlayers =
      game.players.length + (game.aiPlayers?.length || 0);

    if (totalActivePlayers >= game.maxPlayers) {
      return await this.replaceAIWithPlayerLogic(game, username);
    }

    if (game.isPrepared && game.currentRound > 0) {
      await this.giveCompensationCards(game, username);
    }

    game.players.push(username);
    game.lastActivity = new Date();
    const totalPlayers = game.players.length;
    const maxPlayers = game.maxPlayers;

    if (totalPlayers === maxPlayers && game.isPaused) {
      game.isPaused = false;
      if (game.isFirstTurnOfRound) {
        game.currentPlayerIndex = 0;
      }
    }

    await game.save();

    this.gameGateway.emitPlayerJoined(game, username);
    this.gameGateway.emitGameStateChanged(game);

    return game;
  }

  private validateJoinGame(game: GameDocument, username: string): void {
    if (game.isFinished) {
      throw new BadRequestException('Cannot join a finished game');
    }

    if (game.players.includes(username)) {
      throw new BadRequestException('Player already in game');
    }

    if (game.isRoundCardRevealed) {
      throw new BadRequestException(
        'You cannot join the game during the end of a round.' +
          'Wait for the round to end and start a new one.',
      );
    }

    const allPlayers = this.getAllPlayers(game);
    if (game.playersTakenColumn.length === allPlayers.length) {
      throw new BadRequestException(
        'You cannot join the game while all players are taking columns.' +
          'Wait until the round is over.',
      );
    }
  }

  private async giveCompensationCards(
    game: GameDocument,
    newPlayer: string,
  ): Promise<void> {
    const roundsPlayed = game.currentRound;
    let cardsPerRound: number;

    if (game.maxPlayers === 2) {
      cardsPerRound = 1;
    } else {
      cardsPerRound = 0.5;
    }

    const compensationCards = Math.floor(roundsPlayed * cardsPerRound);
    const maxCards = 4;
    const cardsToGive = Math.min(compensationCards, maxCards);

    if (cardsToGive <= 0) {
      return;
    }

    const startIndex = Math.max(0, game.deck.length - cardsToGive);
    const cardsTaken = game.deck.splice(startIndex, cardsToGive);

    cardsTaken.forEach((card) => {
      card.isCompensation = true;
    });

    this.addToPlayerCollection(game, newPlayer, cardsTaken);
  }

  private addToPlayerCollection(
    game: GameDocument,
    player: string,
    cards: Card[],
  ): void {
    if (cards.length === 0) return;

    if (!game.playerCollections) {
      game.playerCollections = new Map<string, Card[]>();
    }

    const collections = game.playerCollections as Map<string, Card[]>;

    const currentCollection = collections.get(player) || [];
    collections.set(player, [...currentCollection, ...cards]);
  }

  private async replaceAIWithPlayerLogic(
    game: GameDocument,
    username: string,
  ): Promise<GameDocument> {
    const aiToReplace = game.aiPlayers[0];
    if (!aiToReplace) {
      throw new BadRequestException('No AI available to replace');
    }

    const result = await this.aiReplacementService.replaceAIWithPlayer(
      game.gameName,
      aiToReplace.name,
      username,
    );

    if (!result.success || !result.gameState) {
      throw new BadRequestException(result.message || 'Failed to replace AI');
    }

    return result.gameState;
  }

  async replaceAIWithPlayer(
    gameName: string,
    originalAIName: string,
    newPlayerName: string,
  ): Promise<ReplacementResult> {
    return await this.aiReplacementService.replaceAIWithPlayer(
      gameName,
      originalAIName,
      newPlayerName,
    );
  }

  async joinGameWithAIReplacement(gameName: string, username: string) {
    return await this.aiReplacementService.joinGameWithAIReplacement(
      gameName,
      username,
    );
  }

  async getReplaceableAIs(gameName: string) {
    return await this.aiReplacementService.getReplaceableAIs(gameName);
  }

  async leaveGame(gameName: string, username: string): Promise<void> {
    const game = await this.findGameByName(gameName);
    const allPlayers = this.getAllPlayers(game);
    const currentPlayerBefore = allPlayers[game.currentPlayerIndex];
    const leavingPlayerIndex = allPlayers.indexOf(username);

    if (!game.players.includes(username)) {
      throw new NotFoundException(`Player '${username}' not found in game`);
    }

    const humanPlayers = game.players.filter((p) => p !== username);
    if (game.isAiEnabled && humanPlayers.length > 0 && !game.isRoundCardRevealed) {
      const wasOwner = game.owner === username;
      const oldOwner = username;
      const result = await this.aiReplacementService.replacePlayerWithAI(
        gameName,
        username,
      );

      if (result.success) {
        const gameUpdated = await this.findGameByName(gameName);
        const allPlayersAfter = this.getAllPlayers(gameUpdated);

        if (currentPlayerBefore !== username) {
          const newIndex = allPlayersAfter.indexOf(currentPlayerBefore);
          if (newIndex !== -1) {
            gameUpdated.currentPlayerIndex = newIndex;
          }
        } else {
          let found = false;
          for (let i = 0; i < allPlayersAfter.length; i++) {
            const player = allPlayersAfter[i];
            if (player && !gameUpdated.playersTakenColumn.includes(player)) {
              gameUpdated.currentPlayerIndex = i;
              found = true;
              break;
            }
          }
          if (!found) {
            gameUpdated.currentPlayerIndex = 0;
          }
        }

        if (wasOwner) {
          const nextHumanOwner = humanPlayers[0];
          gameUpdated.owner = nextHumanOwner;
          this.gameGateway.emitOwnerChanged(gameUpdated, {
            oldOwner: oldOwner,
            newOwner: nextHumanOwner,
            wasOwner: true,
          });
        }

        await gameUpdated.save();

        this.gameGateway.emitGameStateChanged(gameUpdated);
        this.gameGateway.emitPlayerLeft(gameUpdated, username);
        this.gameGateway.emitGameListUpdated();
        return;
      }
    }

    const playerCards = this.getPlayerCollection(game, username);
    const wildCards = this.getPlayerWildCards(game, username);
    const allCards = [...playerCards, ...wildCards];

    if (!game.isFinished && allCards.length > 0) {
      const columnCards = allCards.filter(
        (card) =>
          card.color.startsWith('green_column') ||
          card.color.startsWith('brown_column'),
      );

      const otherCards = allCards.filter((card) => !columnCards.includes(card));

      if (otherCards.length > 0) {
        game.deck.push(...otherCards);
      }

      for (const card of columnCards) {
        const emptyColumn = game.columns.find((col) => col.cards.length === 0);
        if (emptyColumn) {
          emptyColumn.cards.push(card);
        } else {
          game.deck.push(card);
        }
      }
    }

    if (allPlayers[game.currentPlayerIndex] === username && !game.isFinished) {
      this.turnPhase.advanceTurn(game);
    }

    game.players = game.players.filter((p) => p !== username);
    game.playersTakenColumn = game.playersTakenColumn.filter(
      (p) => p !== username,
    );

    if (allPlayers[game.currentPlayerIndex] === username) {
      let found = false;
      for (let i = 0; i < this.getAllPlayers(game).length; i++) {
        const player = this.getAllPlayers(game)[i];
        if (player && !game.playersTakenColumn.includes(player)) {
          game.currentPlayerIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        game.currentPlayerIndex = 0;
      }
    } else if (leavingPlayerIndex < game.currentPlayerIndex) {
      game.currentPlayerIndex--;
    }

    if (!game.isFinished) {
      this.cleanupPlayerCollections(game, username);
    }

    if (game.owner === username && game.players.length > 0) {
      const nextOwner = game.players[0];
      game.owner = nextOwner;
    }

    if (game.players.length === 1 && !game.isFinished) {
      game.isPaused = true;
      game.playersTakenColumn = [];
      game.isRoundCardRevealed = false;
      game.isFirstTurnOfRound = true;
    }

    if (game.players.length < game.maxPlayers && !game.isFinished) {
      game.isPaused = true;
    }

    if (game.players.length === 0) {
      game.isAvailable = false;
      game.lastActivity = new Date();
      this.gameGateway.emitGameUnavailable(game);

      setTimeout(async () => {
        try {
          const freshGame = await this.gameModel.findById(game._id);
          if (freshGame && freshGame.players.length === 0) {
            await this.deleteGame(freshGame);
          }
        } catch (error) {
          console.error('Error deleting empty save file:', error);
        }
      }, 12000);
    }

    await game.save();
    this.gameGateway.emitGameStateChanged(game);
    this.gameGateway.emitPlayerLeft(game, username);
    this.gameGateway.emitGameListUpdated();

    if (game.owner === username) {
      this.gameGateway.emitOwnerChanged(game, {
        oldOwner: username,
        newOwner: game.owner,
        wasOwner: true,
      });
    }
  }

  private getPlayerCollection(game: GameDocument, username: string): Card[] {
    if (game.playerCollections instanceof Map) {
      return game.playerCollections.get(username) || [];
    }
    return game.playerCollections?.[username] || [];
  }

  private getPlayerWildCards(game: GameDocument, username: string): Card[] {
    if (game.wildCards instanceof Map) {
      return game.wildCards.get(username) || [];
    }
    return game.wildCards?.[username] || [];
  }

  private async handlePlayerLeaveInFinishedGame(
    game: GameDocument,
    username: string,
  ): Promise<void> {
    game.players = game.players.filter((player) => player !== username);
    await game.save();
    this.gameGateway.emitPlayerLeft(game, username);
  }

  private async createAIReplacementForLeavingPlayer(
    game: GameDocument,
    leavingPlayer: string,
  ): Promise<void> {
    const remainingPlayers = [
      ...game.players.filter((p) => p !== leavingPlayer),
      ...game.aiPlayers.map((ai) => ai.name),
    ];

    const newAIName = this.aiPreparationService.generateAIPlayerNames(
      1,
      remainingPlayers,
    )[0];
    const gameDifficulty = game.difficultyLevel as 'Basic' | 'Expert';

    const newAI = {
      name: newAIName,
      difficulty: gameDifficulty,
      strategy: this.determineStrategyForDifficulty(gameDifficulty),
    };

    await this.copyPlayerProgressToAI(game, leavingPlayer, newAIName);

    game.players = game.players.filter((p) => p !== leavingPlayer);
    game.aiPlayers.push(newAI);

    this.updatePlayersTakenColumnForReplacement(game, leavingPlayer, newAIName);

    if (!game.replacedPlayers) game.replacedPlayers = new Map();
    game.replacedPlayers.set(newAIName, {
      originalAIName: leavingPlayer,
      replacedBy: newAIName,
      replacedAt: new Date(),
    });

    this.gameGateway.emitToGame(game.gameName, 'player_replaced_by_ai', {
      originalPlayer: leavingPlayer,
      newAI: newAIName,
      game: this.gameGateway.sanitizeGameForEmission(game),
      timestamp: new Date(),
    });
  }

  private async copyPlayerProgressToAI(
    game: GameDocument,
    playerName: string,
    aiName: string,
  ): Promise<void> {
    if (game.playerCollections instanceof Map) {
      const playerCollection = game.playerCollections.get(playerName) || [];
      game.playerCollections.set(aiName, [...playerCollection]);
    } else if (game.playerCollections) {
      game.playerCollections[aiName] = game.playerCollections[playerName] || [];
    }

    if (game.wildCards instanceof Map) {
      const playerWildCards = game.wildCards.get(playerName) || [];
      game.wildCards.set(aiName, [...playerWildCards]);
    } else if (game.wildCards) {
      game.wildCards[aiName] = game.wildCards[playerName] || [];
    }

    if (game.summaryCards instanceof Map) {
      const playerSummaryCards = game.summaryCards.get(playerName) || [];
      game.summaryCards.set(aiName, [...playerSummaryCards]);
    } else if (game.summaryCards) {
      game.summaryCards[aiName] = game.summaryCards[playerName] || [];
    }
  }

  private updatePlayersTakenColumnForReplacement(
    game: GameDocument,
    oldPlayer: string,
    newPlayer: string,
  ): void {
    if (game.playersTakenColumn.includes(oldPlayer)) {
      const index = game.playersTakenColumn.indexOf(oldPlayer);
      if (index !== -1) {
        game.playersTakenColumn.splice(index, 1);
        if (!game.playersTakenColumn.includes(newPlayer)) {
          game.playersTakenColumn.push(newPlayer);
        }
      }
    }
  }

  private determineStrategyForDifficulty(
    difficulty: 'Basic' | 'Expert',
  ): 'conservative' | 'balanced' | 'aggressive' {
    const strategies = {
      Basic: ['conservative', 'balanced'] as const,
      Expert: ['balanced', 'aggressive'] as const,
    };

    const available = strategies[difficulty];
    return available[Math.floor(Math.random() * available.length)];
  }

  private cleanupPlayerCollections(game: GameDocument, username: string): void {
    if (game.playerCollections instanceof Map) {
      game.playerCollections.delete(username);
    } else if (game.playerCollections) {
      delete game.playerCollections[username];
    }

    if (game.replacedPlayers instanceof Map) {
      game.replacedPlayers.delete(username);
    } else if (game.replacedPlayers) {
      delete game.replacedPlayers[username];
    }
  }

  private async deleteGame(game: GameDocument): Promise<void> {
    await this.messagesService.deleteMessagesByGame(game.gameName);
    await this.gameModel.deleteOne({ gameName: game.gameName });
    this.gameGateway.emitGameDeleted(game.gameName);
  }

  private emitPlayerLeftEvents(game: GameDocument, username: string): void {
    this.gameGateway.emitPlayerLeft(game, username);
    this.gameGateway.emitToGame(game.gameName, 'playerLeft', {
      username,
      players: game.players,
      currentPlayers: game.players.length,
      newOwner: game.owner,
      aiReplaced: true,
    });
  }

  async selectDifficultyAndPrepareGame(
    gameName: string,
    level: 'Basic' | 'Expert',
  ): Promise<GameDocument> {
    const game = await this.findGameByName(gameName);

    if (game.isPrepared) {
      throw new BadRequestException('Game is already prepared');
    }

    if (game.players.length < 2) {
      throw new BadRequestException(
        'Need at least 2 players to start the game',
      );
    }

    game.difficultyLevel = level;
    game.preparationTime = new Date();
    game.lastActivity = new Date();

    await game.save();

    return game;
  }

  async prepareGame(gameName: string, level: string): Promise<GameDocument> {
    return this.preparationPhase.prepareGame(gameName, level);
  }

  async prepareAIGame(
    gameName: string,
    owner: string,
    numberOfAIPlayers: number,
    difficulty: 'Basic' | 'Expert' = 'Basic',
  ): Promise<GameDocument> {
    return this.aiPreparationService.prepareAIGame(
      gameName,
      owner,
      numberOfAIPlayers,
      difficulty,
    );
  }

  async createAIGameOnly(
    gameName: string,
    owner: string,
    numberOfAIPlayers: number,
    difficulty: 'Basic' | 'Expert' = 'Basic',
  ): Promise<GameDocument> {
    return this.aiPreparationService.createAIGameOnly(
      gameName,
      owner,
      numberOfAIPlayers,
      difficulty,
    );
  }

  async getPreparationTimeRemaining(gameName: string): Promise<number> {
    const game = await this.findGameByName(gameName);

    if (!game.preparationTime) {
      return 0;
    }

    const preparationEndTime = new Date(game.preparationTime);
    preparationEndTime.setMinutes(preparationEndTime.getMinutes() + 5);

    const now = new Date();
    const timeRemaining = preparationEndTime.getTime() - now.getTime();

    return Math.max(0, Math.floor(timeRemaining / 1000));
  }

  async executeAiTurn(gameName: string, aiPlayerName: string): Promise<any> {
    let retries = 2;

    while (retries > 0) {
      try {
        const game = await this.findGameByName(gameName);

        if (!game || game.players.length === 0) {
          return { success: true, message: 'Game deleted, turn skipped' };
        }

        const result = await this.aiPhaseTurnService.executeAITurn(
          game,
          aiPlayerName,
        );

        if (game.playersTakenColumn.includes(aiPlayerName)) {
          const nextPlayer = this.findNextPlayerWithoutColumn(game);
          if (nextPlayer) {
            const allPlayers = this.getAllPlayers(game);
            game.currentPlayerIndex = allPlayers.indexOf(nextPlayer);
            await game.save();
            return {
              success: true,
              message: `Skipped turn, now: ${nextPlayer}`,
            };
          }
        }

        if (result && Array.isArray(result)) {
          const endRoundAction = result.find(
            (action) =>
              action.action === 'round_end' ||
              (action.card &&
                (action.card.isEndRound || action.card.color === 'endRound')),
          );

          if (endRoundAction) {
            game.isRoundCardRevealed = true;
            if (endRoundAction.card) {
              this.gameGateway.emitCardRevealed(game, endRoundAction.card);
              this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
                game: this.gameGateway.sanitizeGameForEmission(game),
                revealedCard: endRoundAction.card,
                playerName: aiPlayerName,
                isAI: true,
                timestamp: new Date(),
              });
            }

            this.gameGateway.emitGameStateChanged(game);
          }
        }

        if (this.haveAllPlayersTakenColumn(game)) {
          await this.handleRoundEnd(gameName);
          return { success: true, roundEnded: true };
        }

        if (result.length > 0 && result[result.length - 1].updatedGameState) {
          const lastAction = result[result.length - 1];
          this.updateGameFromActionResult(game, lastAction.updatedGameState);
        }

        if (result && Array.isArray(result)) {
          const roundEndActions = result.filter(
            (action) =>
              action.action === 'round_should_end_after_take' ||
              action.action === 'round_end_forced' ||
              action.action === 'round_end',
          );

          if (roundEndActions.length > 0) {
            await game.save();
            await this.handleRoundEnd(gameName);
            return {
              success: true,
              roundEnded: true,
              message: 'Round ended by AI action',
              result: result,
            };
          }
        }

        if (this.haveAllPlayersTakenColumn(game)) {
          await game.save();
          await this.handleRoundEnd(gameName);
          return {
            success: true,
            roundEnded: true,
            message: 'Round ended after AI turn',
          };
        }

        const endRoundCard = this.findEndRoundCardInColumns(game);
        if (endRoundCard) {
          this.emitEndRoundCardEvents(game, aiPlayerName, endRoundCard);
        }

        await game.save();

        return result;
      } catch (error) {
        if (error.name === 'VersionError') {
          retries--;

          if (retries === 0) {
            throw error;
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        } else {
          throw error;
        }
      }
    }
  }

  private findNextPlayerWithoutColumn(game: GameDocument): string | null {
    const allPlayers = this.getAllPlayers(game);

    for (let i = 0; i < allPlayers.length; i++) {
      const player =
        allPlayers[(game.currentPlayerIndex + i) % allPlayers.length];
      if (!game.playersTakenColumn.includes(player)) {
        return player;
      }
    }

    return null;
  }

  private haveAllPlayersTakenColumn(game: GameDocument): boolean {
    const allPlayers = this.getAllPlayers(game);
    return allPlayers.every((player) =>
      game.playersTakenColumn.includes(player),
    );
  }

  private updateGameFromActionResult(
    game: GameDocument,
    updatedState: any,
  ): void {
    game.playersTakenColumn = updatedState.playersTakenColumn || [];
    game.currentPlayerIndex = updatedState.currentPlayerIndex || 0;
    game.columns = updatedState.columns || [];
    game.deck = updatedState.deck || [];

    if (updatedState.playerCollections) {
      game.playerCollections = updatedState.playerCollections;
    }
    if (updatedState.wildCards) {
      game.wildCards = updatedState.wildCards;
    }
  }

  private findEndRoundCardInColumns(game: GameDocument): Card | null {
    for (const column of game.columns) {
      for (const card of column.cards) {
        if (card.isEndRound || card.color === 'endRound') {
          return card;
        }
      }
    }
    return null;
  }

  private emitEndRoundCardEvents(
    game: GameDocument,
    playerName: string,
    card: Card,
  ): void {
    this.gameGateway.emitCardRevealed(game, card);
    this.gameGateway.emitToGame(game.gameName, 'endRoundCardRevealed', {
      game,
      revealedCard: card,
      playerName,
      isAI: true,
    });
  }

  async revealCard(gameName: string, playerName: string, columnIndex: number) {
    const game = await this.findGameByName(gameName);
    const originalDeck = [...game.deck];

    const result = await this.turnPhase.revealCard(
      game,
      playerName,
      columnIndex,
    );

    if (result.success) {
      if (result.card?.color !== 'golden_wild') {
        game.deck = [...originalDeck];
        game.deck.shift();
      }

      try {
        await game.save();
      } catch (error) {
        if (error.name === 'VersionError') {
          const freshGame = await this.findGameByName(gameName);
          Object.assign(game, freshGame.toObject());
        } else {
          throw error;
        }
      }

      this.emitRevealCardEvents(gameName, game, playerName, result);
    }

    return result;
  }

  private emitRevealCardEvents(
    gameName: string,
    game: GameDocument,
    playerName: string,
    result: any,
  ): void {
    this.gameGateway.emitCardRevealed(game, result.card!);

    if (
      result.card &&
      (result.card.isEndRound || result.card.color === 'endRound')
    ) {
      this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
        game,
        revealedCard: result.card,
        playerName,
      });
    } else if (result.goldenWildAdditionalCard && result.goldenWildEndRound) {
      this.gameGateway.emitToGame(gameName, 'endRoundCardRevealed', {
        game,
        revealedCard: result.goldenWildAdditionalCard,
        playerName,
        viaGoldenWild: true,
      });
    }
  }

  async takeColumn(gameName: string, playerName: string, columnIndex: number) {
    const game = await this.findGameByName(gameName);
    const result = await this.turnPhase.takeColumn(
      game,
      playerName,
      columnIndex,
    );

    if (result.success) {
      await game.save();
      this.emitColumnTakenEvents(gameName, game, columnIndex, playerName);

      if (this.haveAllPlayersTakenColumn(game)) {
        await this.handleRoundEnd(gameName);
        return { ...result, roundEnded: true };
      }
    }

    return result;
  }

  private emitColumnTakenEvents(
    gameName: string,
    game: GameDocument,
    columnIndex: number,
    playerName: string,
  ): void {
    this.gameGateway.emitColumnTaken(game, columnIndex, playerName);
    this.gameGateway.emitGameStateChanged(game);
    this.gameGateway.emitToGame(gameName, 'columnTaken', {
      columnIndex,
      playerName,
      game: this.gameGateway.sanitizeGameForEmission(game),
    });
  }

  async handleRoundEnd(gameName: string): Promise<any> {
    const game = await this.findGameByName(gameName);

    if (game.isRoundCardRevealed && game.playersTakenColumn?.length === 0) {
      return;
    }

    this.gameGateway.emitToGame(gameName, 'reassignmentStarting', {
      gameName,
      message: 'End of round. Reassigning column charts...',
      duration: 3000,
      timestamp: new Date(),
      round: game.currentRound,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let result;
    if (game.aiPlayers.length > 0) {
      result = await this.aiRoundEndPhase.handleAIRoundEnd(game);
      if (result && result.action === 'game_end') {
        return await this.finalizeAndCalculateScores(gameName);
      }
    } else {
      result = await this.roundEndPhase.handleRoundEnd(game);
    }

    const updatedGame = await this.findGameByName(gameName);
    if (this.shouldEndGame(updatedGame)) {
      return await this.finalizeAndCalculateScores(gameName);
    }

    this.emitRoundEndCompleteEvents(gameName, updatedGame);

    return result;
  }

  async shouldEndRound(gameName: string): Promise<boolean> {
    const game = await this.findGameByName(gameName);

    if (game.isRoundCardRevealed) {
      return true;
    }

    const allPlayers = [
      ...game.players,
      ...game.aiPlayers.map((ai) => ai.name),
    ];

    const allTakenColumn = allPlayers.every((player) =>
      game.playersTakenColumn.includes(player),
    );

    return allTakenColumn || game.deck.length === 0;
  }

  private shouldEndGame(game: GameDocument): boolean {
    const allPlayers = this.getAllPlayers(game);

    const condition1 =
      game.isRoundCardRevealed &&
      allPlayers.every((player) => game.playersTakenColumn.includes(player));

    const condition2 =
      game.deck.length === 0 &&
      game.columns.every((column) => column.cards.length === 0);

    return condition1 || condition2;
  }

  private emitRoundEndCompleteEvents(
    gameName: string,
    game: GameDocument,
  ): void {
    this.gameGateway.emitToGame(gameName, 'reassignmentComplete', {
      gameName,
      timestamp: new Date(),
      round: game.currentRound,
      game: this.gameGateway.sanitizeGameForEmission(game),
    });

    this.gameGateway.emitGameStateChanged(game);
  }

  async checkAndHandleRoundEnd(gameName: string): Promise<boolean> {
    const game = await this.findGameByName(gameName);

    if (game.isRoundCardRevealed) {
      if (this.haveAllPlayersTakenColumn(game)) {
        await this.handleRoundEnd(gameName);
        return true;
      }
      return false;
    }

    if (this.haveAllPlayersTakenColumn(game)) {
      await this.handleRoundEnd(gameName);
      return true;
    }

    return false;
  }

  async finalizeAndCalculateScores(gameName: string): Promise<any> {
    const game = await this.findGameByName(gameName);
    await game.save();

    const result = await this.gameEndPhase.handleGameEnd(game);

    game.isFinished = true;
    game.finalScores = result.finalScores;
    game.winner = result.winners;
    await game.save();

    for (const player of game.players) {
      const won = result.winners.includes(player);
      await this.userModel.updateOne(
        { username: player },
        {
          $inc: {
            gamesPlayed: 1,
            gamesWon: won ? 1 : 0,
            gamesLost: won ? 0 : 1,
          },
        },
      );
    }

    this.emitGameFinalizedEvents(gameName, game, result);

    return result;
  }

  private emitGameFinalizedEvents(
    gameName: string,
    game: GameDocument,
    result: any,
  ): void {
    this.gameGateway.emitGameFinalized(
      game,
      result.finalScores,
      result.winners,
    );
    this.gameGateway.emitGameStateChanged(game);
    this.gameGateway.emitToGame(gameName, 'game_finalized', {
      game: this.gameGateway.sanitizeGameForEmission(game),
      finalScores: result.finalScores,
      winner: result.winners,
      timestamp: new Date(),
    });
  }

  private getAllPlayers(game: GameDocument): string[] {
    return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
  }
}
