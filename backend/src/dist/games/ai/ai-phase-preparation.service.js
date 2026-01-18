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
exports.AiPhasePreparationService = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const game_schema_1 = require("../game.schema");
const game_gateway_1 = require("../game.gateway");
let AiPhasePreparationService = class AiPhasePreparationService {
    constructor(gameModel, gameGateway) {
        this.gameModel = gameModel;
        this.gameGateway = gameGateway;
    }
    async prepareAIGame(gameName, owner, numberOfAIPlayers, difficulty = 'Basic') {
        const game = await this.gameModel.findOne({ gameName }).exec();
        if (!game) {
            throw new Error(`Partida ${gameName} no encontrada`);
        }
        const aiPlayers = this.configureAIPlayers(numberOfAIPlayers, difficulty, game.players);
        game.aiPlayers = aiPlayers;
        const totalPlayers = game.players.length + numberOfAIPlayers;
        if (totalPlayers > game.maxPlayers) {
            game.maxPlayers = totalPlayers;
        }
        await game.save();
        this.emitGameEvents(game);
        return game;
    }
    configureAIPlayers(count, difficulty, existingPlayers) {
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
    generateAIPlayerNames(count, existingPlayers) {
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
    determineStrategy(difficulty) {
        const strategies = {
            Basic: ['conservative', 'balanced'],
            Expert: ['balanced', 'aggressive'],
        };
        const available = strategies[difficulty];
        return available[Math.floor(Math.random() * available.length)];
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    async createAIGameOnly(gameName, owner, numberOfAIPlayers, difficulty = 'Basic') {
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
    emitGameEvents(game) {
        this.gameGateway.emitPreparationStarted(game);
        this.gameGateway.emitGamePrepared(game);
        this.gameGateway.emitCardsAssigned(game);
    }
};
exports.AiPhasePreparationService = AiPhasePreparationService;
exports.AiPhasePreparationService = AiPhasePreparationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(game_schema_1.Game.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_gateway_1.GameGateway))),
    __metadata("design:paramtypes", [mongoose_1.Model,
        game_gateway_1.GameGateway])
], AiPhasePreparationService);
//# sourceMappingURL=ai-phase-preparation.service.js.map