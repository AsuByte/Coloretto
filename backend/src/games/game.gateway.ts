import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Game, GameDocument } from '@/games/game.schema';
import { Card } from '@/games/card/card.schema';
import { AiPhaseTurnService } from '@/games/ai/ai-phase-turn.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(forwardRef(() => AiPhaseTurnService))
    private aiPhaseTurnService?: AiPhaseTurnService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {}

  handleConnection() {}

  handleDisconnect() {}

  emitGameCreated(game: Game) {
    this.server.emit('gameCreated', this.sanitizeGameForEmission(game));
  }

  emitPlayerJoined(
    game: GameDocument,
    username: string,
    replacedAI?: string,
  ): void {
    const data: any = {
      username,
      players: game.players,
      currentPlayers: game.players.length,
      game: this.sanitizeGameForEmission(game),
    };

    if (replacedAI) {
      data.replacedAI = replacedAI;
      data.isAIReplacement = true;
    }

    this.server.to(game.gameName).emit('player_joined', data);
    this.server.emit('playerJoined', { username });
  }

  emitOwnerChanged(
    game: GameDocument,
    data: {
      oldOwner: string;
      newOwner: string;
      wasOwner: boolean;
    },
  ): void {
    this.server.to(game.gameName).emit('ownerChanged', {
      gameName: game.gameName,
      oldOwner: data.oldOwner,
      newOwner: data.newOwner,
      game: this.sanitizeGameForEmission(game),
      wasOwner: data.wasOwner,
      timestamp: new Date(),
    });

    this.server.emit('ownerChangedGlobal', {
      gameName: game.gameName,
      newOwner: data.newOwner,
    });
  }

  emitOwnerReplacedByAI(
    game: GameDocument,
    originalOwner: string,
    newAI: string,
  ): void {
    this.server.to(game.gameName).emit('owner_replaced_by_ai', {
      game: this.sanitizeGameForEmission(game),
      originalOwner,
      newAI,
      timestamp: new Date(),
      players: game.players,
      aiPlayers: game.aiPlayers,
      newOwner: game.owner,
    });
  }

  emitAIRepalaced(
    game: GameDocument,
    originalAI: string,
    newPlayer: string,
  ): void {
    this.server.to(game.gameName).emit('ai_replaced', {
      game: this.sanitizeGameForEmission(game),
      originalAI,
      newPlayer,
      timestamp: new Date(),
    });

    this.emitGameStateChanged(game);
  }

  emitPlayerLeft(game: GameDocument, username: string): void {
    this.server.emit('playerLeft', {
      game: this.sanitizeGameForEmission(game),
      username,
      timestamp: new Date(),
    });

    this.emitGameStateChanged(game);
  }

  emitGameDeleted(gameName: string) {
    this.server.emit('gameDeleted', { gameName });
  }

  emitGamePrepared(game: GameDocument) {
    this.server.emit('gamePrepared', this.sanitizeGameForEmission(game));
  }

  emitGameListUpdated(): void {
    this.server.emit('gameListUpdated');
  }

  emitGameStateChanged(game: GameDocument): void {
    this.server.emit('gameStateChanged', this.sanitizeGameForEmission(game));
  }

  emitPreparationStarted(game: GameDocument): void {
    this.server.emit('preparationStarted', {
      gameName: game.gameName,
      preparationTime: game.preparationTime,
      difficulty: game.difficultyLevel,
    });
  }

  emitCardsAssigned(game: GameDocument) {
    this.server.emit('cardsAssigned', this.sanitizeGameForEmission(game));
  }

  emitNextTurn(game: GameDocument) {
    const allPlayers = [
      ...game.players,
      ...game.aiPlayers.map((ai) => ai.name),
    ];
    const currentPlayer = allPlayers[game.currentPlayerIndex];

    this.server.emit('nextTurn', {
      gameName: game.gameName,
      currentPlayerIndex: game.currentPlayerIndex,
      currentPlayer: currentPlayer,
      isAIPlayer: game.aiPlayers.some((ai) => ai.name === currentPlayer),
    });
  }

  emitReassignmentStarting(game: GameDocument): void {
    this.server.to(game.gameName).emit('reassignmentStarting', {
      gameName: game.gameName,
      message: 'End of round. Reassigning column charts...',
      duration: 3000,
      timestamp: new Date(),
      round: game.currentRound,
    });
  }

  emitReassignmentComplete(game: GameDocument): void {
    this.server.to(game.gameName).emit('reassignmentComplete', {
      gameName: game.gameName,
      timestamp: new Date(),
      round: game.currentRound,
      game: this.sanitizeGameForEmission(game),
    });
  }

  emitCardRevealed(game: GameDocument, revealedCard: Card) {
    this.server.emit('cardRevealed', {
      game: this.sanitizeGameForEmission(game),
      revealedCard,
    });
  }

  emitAICardRevealed(
    game: GameDocument,
    playerId: string,
    card: Card,
    columnIndex: number,
  ) {
    this.server.to(game.gameName).emit('ai_card_revealed', {
      game: this.sanitizeGameForEmission(game),
      revealedCard: card,
      playerName: playerId,
      columnIndex: columnIndex,
      isAI: true,
      timestamp: new Date(),
    });

    this.emitCardRevealed(game, card);
  }

  emitRoundEndCardRevealed(game: Game, playerId: string, card: Card) {
    this.server.emit('round_end_card_revealed', {
      game: this.sanitizeGameForEmission(game),
      card: card,
      playerId: playerId,
      timestamp: new Date(),
    });

    this.server.to(game.gameName).emit('round_end_card_revealed', {
      gameName: this.sanitizeGameForEmission(game),
      playerId: playerId,
      card: card,
      timestamp: new Date(),
    });
  }

  emitAIRoundEndCard(game: GameDocument, playerId: string, card: Card): void {
    AiPhaseTurnService.recordRoundEndCard(game._id.toString());

    this.server.emit('ai_round_end_card', {
      game: this.sanitizeGameForEmission(game),
      revealedCard: card,
      playerName: playerId,
      isAI: true,
      timestamp: new Date(),
    });

    this.server.to(game.gameName).emit('ai_round_end_card', {
      game: this.sanitizeGameForEmission(game),
      revealedCard: card,
      playerName: playerId,
      isAI: true,
      timestamp: new Date(),
    });
  }

  emitColumnTaken(game: GameDocument, columnIndex: number, playerName: string) {
    this.server.emit('columnTaken', {
      game: this.sanitizeGameForEmission(game),
      columnIndex,
      playerName,
      playerCollections: this.convertMapToObject(game.playerCollections),
      wildCards: this.convertMapToObject(game.wildCards),
    });
  }

  emitGameFinalized(
    game: GameDocument,
    finalScores: Record<string, number>,
    winners: string[],
  ) {
    this.emitToGame(game.gameName, 'gameFinalized', {
      game: this.sanitizeGameForEmission(game),
      finalScores,
      winners,
      finalizedAt: new Date(),
    });
  }

  emitGameUnavailable(game: GameDocument): void {
    this.server.emit('gameUnavailable', {
      gameName: game.gameName,
      game: this.sanitizeGameForEmission(game),
      timestamp: new Date(),
    });
  }

  public sanitizeGameForEmission(game: Game | GameDocument): any {
    let sanitized: any;
    if (game && typeof (game as GameDocument).toObject === 'function') {
      sanitized = (game as GameDocument).toObject();
    } else {
      sanitized = { ...game };
    }

    if (game.playerCollections instanceof Map) {
      sanitized.playerCollections = this.convertMapToObject(
        game.playerCollections,
      );
    } else if (
      typeof game.playerCollections === 'object' &&
      game.playerCollections !== null
    ) {
      sanitized.playerCollections = game.playerCollections;
    } else {
      sanitized.playerCollections = {};
    }

    if (game.wildCards instanceof Map) {
      sanitized.wildCards = this.convertMapToObject(game.wildCards);
    } else if (typeof game.wildCards === 'object' && game.wildCards !== null) {
      sanitized.wildCards = game.wildCards;
    } else {
      sanitized.wildCards = {};
    }

    if (game.summaryCards instanceof Map) {
      sanitized.summaryCards = this.convertMapToObject(game.summaryCards);
    } else if (
      typeof game.summaryCards === 'object' &&
      game.summaryCards !== null
    ) {
      sanitized.summaryCards = game.summaryCards;
    } else {
      sanitized.summaryCards = {};
    }

    return sanitized;
  }

  private convertMapToObject(
    map: Map<any, any> | undefined,
  ): Record<string, any> {
    if (!map || !(map instanceof Map)) {
      return {};
    }

    const obj: Record<string, any> = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  joinGameRoom(client: Socket, gameName: string) {
    client.join(gameName);
  }

  leaveGameRoom(client: Socket, gameName: string) {
    client.leave(gameName);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  emitToGame(gameName: string, event: string, data: any) {
    this.server.to(gameName).emit(event, data);
  }
}
