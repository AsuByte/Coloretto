import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from '@/games/game.service';
import { GameController } from '@/games/game.controller';
import { GameGateway } from '@/games/game.gateway';
import { Game, GameSchema } from '@/games/game.schema';
import { Card, CardSchema } from '@/games/card/card.schema';
import { Column, ColumnSchema } from '@/games/card/card.schema';
import { User, UserSchema } from '@/users/user.schema';
import { UsersModule } from '@/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from '@/messages/message.module';
import { PhasePreparationService } from '@/games/phases/phase-preparation.service';
import { AiPhasePreparationService } from '@/games/ai/ai-phase-preparation.service';
import { DeckService } from '@/games/utils/deck.service';
import { CardDistributionService } from '@/games/utils/card-distribution.service';
import { AiPhaseTurnService } from '@/games/ai/ai-phase-turn.service';
import { AiStrategyService } from '@/games/ai/ai-strategy.service';
import { PhaseTurnService } from '@/games/phases/phase-turn.service';
import { PhaseGameEndService } from '@/games/phases/phase-game-end.service';
import { PhaseRoundEndService } from '@/games/phases/phase-round-end.service';
import { AiPhaseGameEndService } from '@/games/ai/ai-phase-game-end.service';
import { AiPhaseRoundEndService } from '@/games/ai/ai-phase-round-end.service';
import { AiReplacementService } from '@/games/ai/ai-replacement.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
      { name: Column.name, schema: ColumnSchema },
    ]),
    UsersModule,
    MessageModule,
  ],
  providers: [
    GameGateway,
    GameService,
    PhasePreparationService,
    AiPhasePreparationService,
    DeckService,
    CardDistributionService,
    AiPhaseTurnService,
    AiStrategyService,
    PhaseTurnService,
    PhaseRoundEndService,
    AiReplacementService,
    AiPhaseRoundEndService,
    PhaseGameEndService,
    AiPhaseGameEndService,
  ],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
