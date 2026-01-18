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
exports.CardDistributionService = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const common_1 = require("@nestjs/common");
const game_schema_1 = require("../game.schema");
const deck_service_1 = require("./deck.service");
let CardDistributionService = class CardDistributionService {
    constructor(gameModel, deckService) {
        this.gameModel = gameModel;
        this.deckService = deckService;
    }
    async assignInitialCards(players, gameName, numberOfPlayers) {
        const playerCollections = new Map();
        const chameleonCardsPerPlayer = numberOfPlayers === 2 ? 2 : 1;
        const allColors = [
            'red',
            'blue',
            'green',
            'yellow',
            'orange',
            'purple',
            'brown',
        ];
        const shuffledColors = this.deckService.shuffleArray([...allColors]);
        let colorIndex = 0;
        for (const player of players) {
            const initialCards = [];
            for (let i = 0; i < chameleonCardsPerPlayer; i++) {
                if (colorIndex < shuffledColors.length) {
                    initialCards.push({
                        color: shuffledColors[colorIndex],
                        isEndRound: false,
                    });
                    colorIndex++;
                }
            }
            playerCollections.set(player, initialCards);
        }
        return playerCollections;
    }
    assignSummaryCards(game) {
        const summaryCards = [];
        if (game.difficultyLevel === 'Basic') {
            summaryCards.push({ color: 'summary_brown', isEndRound: false });
        }
        else {
            summaryCards.push({ color: 'summary_violet', isEndRound: false });
        }
        const playerNames = [
            ...game.players,
            ...game.aiPlayers.map((ai) => ai.name),
        ];
        const assignedSummaryCards = new Map();
        playerNames.forEach((player) => {
            assignedSummaryCards.set(player, [...summaryCards]);
        });
        return assignedSummaryCards;
    }
};
exports.CardDistributionService = CardDistributionService;
exports.CardDistributionService = CardDistributionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(game_schema_1.Game.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        deck_service_1.DeckService])
], CardDistributionService);
//# sourceMappingURL=card-distribution.service.js.map