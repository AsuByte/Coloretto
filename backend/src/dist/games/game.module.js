"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const mongoose_1 = require("@nestjs/mongoose");
const game_service_1 = require("./game.service");
const game_controller_1 = require("./game.controller");
const game_gateway_1 = require("./game.gateway");
const game_schema_1 = require("./game.schema");
const card_schema_1 = require("./card/card.schema");
const card_schema_2 = require("./card/card.schema");
const user_schema_1 = require("../users/user.schema");
const users_module_1 = require("../users/users.module");
const config_1 = require("@nestjs/config");
const message_module_1 = require("../messages/message.module");
const phase_preparation_service_1 = require("./phases/phase-preparation.service");
const ai_phase_preparation_service_1 = require("./ai/ai-phase-preparation.service");
const deck_service_1 = require("./utils/deck.service");
const card_distribution_service_1 = require("./utils/card-distribution.service");
const ai_phase_turn_service_1 = require("./ai/ai-phase-turn.service");
const ai_strategy_service_1 = require("./ai/ai-strategy.service");
const phase_turn_service_1 = require("./phases/phase-turn.service");
const phase_game_end_service_1 = require("./phases/phase-game-end.service");
const phase_round_end_service_1 = require("./phases/phase-round-end.service");
const ai_phase_game_end_service_1 = require("./ai/ai-phase-game-end.service");
const ai_phase_round_end_service_1 = require("./ai/ai-phase-round-end.service");
const ai_replacement_service_1 = require("./ai/ai-replacement.service");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            axios_1.HttpModule.register({
                timeout: 5000,
                maxRedirects: 5,
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: game_schema_1.Game.name, schema: game_schema_1.GameSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: card_schema_1.Card.name, schema: card_schema_1.CardSchema },
                { name: card_schema_2.Column.name, schema: card_schema_2.ColumnSchema },
            ]),
            users_module_1.UsersModule,
            message_module_1.MessageModule,
        ],
        providers: [
            game_gateway_1.GameGateway,
            game_service_1.GameService,
            phase_preparation_service_1.PhasePreparationService,
            ai_phase_preparation_service_1.AiPhasePreparationService,
            deck_service_1.DeckService,
            card_distribution_service_1.CardDistributionService,
            ai_phase_turn_service_1.AiPhaseTurnService,
            ai_strategy_service_1.AiStrategyService,
            phase_turn_service_1.PhaseTurnService,
            phase_round_end_service_1.PhaseRoundEndService,
            ai_replacement_service_1.AiReplacementService,
            ai_phase_round_end_service_1.AiPhaseRoundEndService,
            phase_game_end_service_1.PhaseGameEndService,
            ai_phase_game_end_service_1.AiPhaseGameEndService,
        ],
        controllers: [game_controller_1.GameController],
        exports: [game_service_1.GameService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map