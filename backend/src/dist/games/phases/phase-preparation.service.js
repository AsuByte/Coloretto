"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhasePreparationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const game_gateway_1 = require("../game.gateway");
const game_schema_1 = require("../game.schema");
const card_distribution_service_1 = require("../utils/card-distribution.service");
const deck_service_1 = require("../utils/deck.service");
let PhasePreparationService = class PhasePreparationService {
    constructor(gameModel, deckService, distributionService, gameGateway) {
        this.gameModel = gameModel;
        this.deckService = deckService;
        this.distributionService = distributionService;
        this.gameGateway = gameGateway;
    }
    async prepareGame(gameName, level) {
        const game = await this.gameModel.findOne({ gameName }).exec();
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.difficultyLevel !== level) {
            throw new common_1.BadRequestException(`You cannot change the game level. The current level is ${game.difficultyLevel}.`);
        }
        const completeDeck = await this.deckService.createDeck(game.maxPlayers);
        const filteredDeck = this.filterDeckByPlayers(completeDeck, game.maxPlayers);
        const [columns, gameDeck] = this.deckService.setupColumnsAndDeck(filteredDeck, game.maxPlayers);
        const allPlayerNames = this.getAllPlayerNames(game);
        const playerCollections = await this.distributionService.assignInitialCards(allPlayerNames, gameName, game.maxPlayers);
        const summaryCards = this.distributionService.assignSummaryCards(game);
        this.setupGameState(game, columns, gameDeck, playerCollections, summaryCards);
        const now = new Date();
        const preparationTime = new Date(now.getTime() + 9000);
        game.preparationTime = preparationTime;
        game.isPrepared = true;
        await game.save();
        this.emitGameEvents(game);
        return game;
    }
    filterDeckByPlayers(deck, maxPlayers) {
        if (maxPlayers === 2) {
            const colorsToRemove = this.deckService.getUniqueChameleonColors(2);
            return deck.filter((card) => !colorsToRemove.includes(card.color));
        }
        else if (maxPlayers === 3) {
            const colorToRemove = this.deckService.getUniqueChameleonColor();
            return deck.filter((card) => card.color !== colorToRemove);
        }
        return deck;
    }
    getAllPlayerNames(game) {
        return [...game.players, ...game.aiPlayers.map((ai) => ai.name)];
    }
    setupGameState(game, columns, gameDeck, playerCollections, summaryCards) {
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
    emitGameEvents(game) {
        this.gameGateway.emitPreparationStarted(game);
        this.gameGateway.emitGamePrepared(game);
        this.gameGateway.emitCardsAssigned(game);
    }
};
exports.PhasePreparationService = PhasePreparationService;
exports.PhasePreparationService = PhasePreparationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(game_schema_1.Game.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [mongoose_1.Model,
        deck_service_1.DeckService,
        card_distribution_service_1.CardDistributionService,
        game_gateway_1.GameGateway])
], PhasePreparationService);
//# sourceMappingURL=phase-preparation.service.js.map