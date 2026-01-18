import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ReplacementResult } from '@/types/interfaces';
import { Game, GameDocument } from '@/games/game.schema';
import { GameGateway } from '@/games/game.gateway';
import { AiPhasePreparationService } from '@/games/ai/ai-phase-preparation.service';

@Injectable()
export class AiReplacementService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private preparationAI: AiPhasePreparationService,
    private gameGateway: GameGateway,
  ) {}

  async replaceAIWithPlayer(
    gameName: string,
    originalAIName: string,
    newPlayerName: string,
  ): Promise<ReplacementResult> {
    try {
      const game = await this.gameModel.findOne({ gameName });
      if (!game) {
        throw new Error(`Game ${gameName} not found`);
      }

      const validationError = this.validateReplacement(
        game,
        originalAIName,
        newPlayerName,
      );
      if (validationError) {
        return validationError;
      }

      await this.copyAIProgressToPlayer(game, originalAIName, newPlayerName);

      game.players.push(newPlayerName);
      game.aiPlayers = game.aiPlayers.filter(
        (ai) => ai.name !== originalAIName,
      );

      this.registerReplacement(game, originalAIName, newPlayerName);

      this.updateTurnAfterReplacement(game, originalAIName, newPlayerName);

      this.updatePlayersTakenColumn(game, originalAIName, newPlayerName);

      await game.save();

      this.emitReplacementEvents(gameName, originalAIName, newPlayerName, game);

      return {
        success: true,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: 'IA replaced correct',
        gameState: game,
      };
    } catch (error) {
      return {
        success: false,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: `Error: ${error.message}`,
      };
    }
  }

  async replacePlayerWithAI(
    gameName: string,
    playerName: string,
  ): Promise<ReplacementResult> {
    try {
      const game = await this.gameModel.findOne({ gameName });
      if (!game) {
        throw new Error(`Game ${gameName} not found`);
      }

      if (!game.players.includes(playerName)) {
        return {
          success: false,
          originalAI: playerName,
          newPlayer: '',
          message: `Player ${playerName} not found`,
        };
      }

      const allExistingPlayers = this.getAllPlayers(game);
      const newAINames = this.preparationAI.generateAIPlayerNames(
        1,
        allExistingPlayers,
      );

      const newAIName = newAINames[0];

      this.copyCollection(game.playerCollections, playerName, newAIName);
      this.copyCollection(game.wildCards, playerName, newAIName);
      this.copyCollection(game.summaryCards, playerName, newAIName);

      game.players = game.players.filter((p) => p !== playerName);

      const aiDifficulty = game.difficultyLevel as 'Basic' | 'Expert';
      game.aiPlayers.push({
        name: newAIName,
        difficulty: aiDifficulty,
        strategy: this.preparationAI.determineStrategy(aiDifficulty),
      });

      const allPlayers = this.getAllPlayers(game);
      const playerIndex = allPlayers.indexOf(playerName);
      if (playerIndex !== -1 && game.currentPlayerIndex === playerIndex) {
        const newAIIndex = allPlayers.indexOf(newAIName);
        if (newAIIndex !== -1) {
          game.currentPlayerIndex = newAIIndex;
        }
      }

      if (game.playersTakenColumn.includes(playerName)) {
        game.playersTakenColumn = game.playersTakenColumn.map((p) =>
          p === playerName ? newAIName : p,
        );
      }

      await game.save();

      this.gameGateway.emitToGame(gameName, 'player_replaced_by_ai', {
        originalPlayer: playerName,
        newAI: newAIName,
        game: this.gameGateway.sanitizeGameForEmission(game),
        timestamp: new Date(),
      });

      this.gameGateway.emitGameStateChanged(game);

      return {
        success: true,
        originalAI: playerName,
        newPlayer: newAIName,
        message: 'Player replaced for IA correct',
        gameState: game,
      };
    } catch (error) {
      return {
        success: false,
        originalAI: playerName,
        newPlayer: '',
        message: `Error: ${error.message}`,
      };
    }
  }

  private validateReplacement(
    game: GameDocument,
    originalAIName: string,
    newPlayerName: string,
  ): ReplacementResult | null {
    if (game.isRoundCardRevealed) {
      return {
        success: false,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: 'AI cannot be replaced during the end of the round',
      };
    }

    const allPlayers = this.getAllPlayers(game);
    if (game.playersTakenColumn.length === allPlayers.length) {
      return {
        success: false,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: 'You cannot replace AI while all players are taking columns',
      };
    }

    const aiPlayer = game.aiPlayers.find((ai) => ai.name === originalAIName);
    if (!aiPlayer) {
      return {
        success: false,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: `IA ${originalAIName} not found in the game`,
      };
    }

    if (this.isPlayerNameTaken(game, newPlayerName)) {
      return {
        success: false,
        originalAI: originalAIName,
        newPlayer: newPlayerName,
        message: `The name ${newPlayerName} is used`,
      };
    }

    return null;
  }

  private async copyAIProgressToPlayer(
    game: GameDocument,
    aiName: string,
    playerName: string,
  ): Promise<void> {
    this.copyCollection(game.playerCollections, aiName, playerName);

    this.copyCollection(game.wildCards, aiName, playerName);

    this.copyCollection(game.summaryCards, aiName, playerName);
  }

  private copyCollection(collection: any, from: string, to: string): void {
    if (collection instanceof Map) {
      const sourceCollection = collection.get(from) || [];
      collection.set(to, [...sourceCollection]);
      collection.delete(from);
    } else if (collection) {
      collection[to] = collection[from] || [];
      delete collection[from];
    }
  }

  private registerReplacement(
    game: GameDocument,
    originalAIName: string,
    newPlayerName: string,
  ): void {
    if (!game.replacedPlayers) game.replacedPlayers = new Map();

    game.replacedPlayers.set(newPlayerName, {
      originalAIName,
      replacedBy: newPlayerName,
      replacedAt: new Date(),
    });
  }

  private updateTurnAfterReplacement(
    game: GameDocument,
    originalAIName: string,
    newPlayerName: string,
  ): void {
    const allPlayers = this.getAllPlayers(game);

    if (allPlayers[game.currentPlayerIndex] === originalAIName) {
      const newIndex = allPlayers.indexOf(newPlayerName);
      if (newIndex !== -1) {
        game.currentPlayerIndex = newIndex;
      }
    }
  }

  private updatePlayersTakenColumn(
    game: GameDocument,
    originalAIName: string,
    newPlayerName: string,
  ): void {
    if (game.playersTakenColumn.includes(originalAIName)) {
      game.playersTakenColumn = game.playersTakenColumn.map((player) =>
        player === originalAIName ? newPlayerName : player,
      );
    }
  }

  private emitReplacementEvents(
    gameName: string,
    originalAI: string,
    newPlayer: string,
    game: GameDocument,
  ): void {
    this.gameGateway.emitToGame(gameName, 'ai_replaced', {
      originalAI,
      newPlayer,
      game: this.gameGateway.sanitizeGameForEmission(game),
      timestamp: new Date(),
    });

    this.gameGateway.emitGameStateChanged(game);
  }

  private getAllPlayers(game: GameDocument): string[] {
    return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
  }

  private isPlayerNameTaken(game: GameDocument, playerName: string): boolean {
    return (
      game.players.includes(playerName) ||
      game.aiPlayers.some((ai) => ai.name === playerName)
    );
  }

  async getReplaceableAIs(gameName: string): Promise<string[]> {
    const game = await this.gameModel.findOne({ gameName });
    if (!game) return [];

    return game.aiPlayers.map((ai) => ai.name);
  }

  canReplaceAI(game: GameDocument, aiName: string): boolean {
    if (game.isFinished) return false;

    const aiExists = game.aiPlayers.some((ai) => ai.name === aiName);
    if (!aiExists) return false;

    const totalPlayers = game.players.length + game.aiPlayers.length;
    if (totalPlayers >= game.maxPlayers) return true;

    return true;
  }

  async joinGameWithAIReplacement(
    gameName: string,
    username: string,
  ): Promise<ReplacementResult> {
    const game = await this.gameModel.findOne({ gameName });
    if (!game) {
      throw new Error(`Game ${gameName} not found`);
    }

    if (this.isPlayerNameTaken(game, username)) {
      return {
        success: false,
        originalAI: '',
        newPlayer: username,
        message: 'You are already in this game',
      };
    }

    const replaceableAIs = await this.getReplaceableAIs(gameName);
    if (replaceableAIs.length === 0) {
      return {
        success: false,
        originalAI: '',
        newPlayer: username,
        message: 'There are no AIs available to replace',
      };
    }

    const aiToReplace = replaceableAIs[0];
    return await this.replaceAIWithPlayer(gameName, aiToReplace, username);
  }
}
