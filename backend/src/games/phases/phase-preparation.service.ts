import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GameGateway } from '@/games/game.gateway';
import { Game, GameDocument } from '@/games/game.schema';
import { CardDistributionService } from '@/games/utils/card-distribution.service';
import { DeckService } from '@/games/utils/deck.service';

@Injectable()
export class PhasePreparationService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private deckService: DeckService,
    private distributionService: CardDistributionService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async prepareGame(gameName: string, level: string): Promise<GameDocument> {
    const game = await this.gameModel.findOne({ gameName }).exec();
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.difficultyLevel !== level) {
      throw new BadRequestException(
        `You cannot change the game level. The current level is ${game.difficultyLevel}.`,
      );
    }

    const completeDeck = await this.deckService.createDeck(game.maxPlayers);

    const filteredDeck = this.filterDeckByPlayers(
      completeDeck,
      game.maxPlayers,
    );

    const [columns, gameDeck] = this.deckService.setupColumnsAndDeck(
      filteredDeck,
      game.maxPlayers,
    );

    const allPlayerNames = this.getAllPlayerNames(game);
    const playerCollections = await this.distributionService.assignInitialCards(
      allPlayerNames,
      gameName,
      game.maxPlayers,
    );

    const summaryCards = this.distributionService.assignSummaryCards(game);

    this.setupGameState(
      game,
      columns,
      gameDeck,
      playerCollections,
      summaryCards,
    );

    const now = new Date();
    const preparationTime = new Date(now.getTime() + 9000);
    game.preparationTime = preparationTime;
    game.isPrepared = true;

    await game.save();
    this.emitGameEvents(game);

    return game;
  }

  private filterDeckByPlayers(deck: any[], maxPlayers: number): any[] {
    if (maxPlayers === 2) {
      const colorsToRemove = this.deckService.getUniqueChameleonColors(2);
      return deck.filter((card) => !colorsToRemove.includes(card.color));
    } else if (maxPlayers === 3) {
      const colorToRemove = this.deckService.getUniqueChameleonColor();
      return deck.filter((card) => card.color !== colorToRemove);
    }
    return deck;
  }

  private getAllPlayerNames(game: GameDocument): string[] {
    return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
  }

  private setupGameState(
    game: GameDocument,
    columns: any[],
    gameDeck: any[],
    playerCollections: any,
    summaryCards: any,
  ): void {
    game.columns = columns;
    game.deck = gameDeck;
    game.playerCollections = playerCollections;
    game.summaryCards = summaryCards;

    const playerNames = this.getAllPlayerNames(game);
    game.currentPlayerIndex =
      this.deckService.chooseStartingPlayer(playerNames);

    game.isRoundCardRevealed = false;
    game.currentRound = 1;
  }

  private emitGameEvents(game: GameDocument): void {
    this.gameGateway.emitPreparationStarted(game);
    this.gameGateway.emitGamePrepared(game);
    this.gameGateway.emitCardsAssigned(game);
  }
}
