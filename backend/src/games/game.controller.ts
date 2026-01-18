import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReplacementResult } from '@/types/interfaces';
import { GameService } from '@/games/game.service';
import { CreateGameDto } from '@/games/dto/create-game-dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async getAvailableGames(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(3), ParseIntPipe) pageSize: number,
  ) {
    return this.gameService.getAvailableGames(page, pageSize);
  }

  @Get(':gameName')
  async getGameByName(@Param('gameName') gameName: string) {
    const decodedGameName = decodeURIComponent(gameName);
    return await this.gameService.findGameByName(decodedGameName);
  }

  @Get('owner/:owner')
  async getUserGame(@Param('owner') owner: string) {
    return await this.gameService.findGameByUser(owner);
  }

  @Get(':gameName/replaceable-ais')
  async getReplaceableAIs(@Param('gameName') gameName: string) {
    const ais = await this.gameService.getReplaceableAIs(gameName);
    return { ais };
  }

  @Get(':gameName/should-end-round')
  async shouldEndRound(@Param('gameName') gameName: string) {
    const shouldEnd = await this.gameService.handleRoundEnd(gameName);
    return { shouldEndRound: shouldEnd };
  }

  @Get(':gameName/preparation-time')
  async getPreparationTimeRemaining(@Param('gameName') gameName: string) {
    const timeRemaining =
      await this.gameService.getPreparationTimeRemaining(gameName);
    return { timeRemaining };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    this.validateGameCreation(createGameDto);
    return await this.gameService.createGame(createGameDto);
  }

  @Post('join')
  async joinGame(@Body() body: { gameName: string; username: string }) {
    return await this.gameService.joinGame(body.gameName, body.username);
  }

  @Post('ai/create-only')
  async createAIGameOnly(
    @Body()
    body: {
      gameName: string;
      owner: string;
      aiCount: number;
      difficulty: 'Basic' | 'Expert';
    },
  ) {
    return await this.gameService.createAIGameOnly(
      body.gameName,
      body.owner,
      body.aiCount,
      body.difficulty,
    );
  }

  @Post(':gameName/prepare')
  async prepareGame(@Param('gameName') gameName: string) {
    const game = await this.gameService.findGameByName(gameName);
    return await this.gameService.prepareGame(gameName, game.difficultyLevel);
  }

  @Post(':gameName/select-difficulty')
  async selectDifficultyAndPrepareGame(
    @Param('gameName') gameName: string,
    @Body('level') level: 'Basic' | 'Expert',
  ) {
    return await this.gameService.selectDifficultyAndPrepareGame(
      gameName,
      level,
    );
  }

  @Post(':gameName/reveal-card')
  async revealCard(
    @Param('gameName') gameName: string,
    @Body() body: { playerName: string; columnIndex: number },
  ) {
    return await this.gameService.revealCard(
      gameName,
      body.playerName,
      body.columnIndex,
    );
  }

  @Post(':gameName/take-column')
  async takeColumn(
    @Param('gameName') gameName: string,
    @Body('playerName') playerName: string,
    @Body('columnIndex') columnIndex: number,
  ) {
    return await this.gameService.takeColumn(gameName, playerName, columnIndex);
  }

  @Post(':gameName/ai-turn')
  async aiTurn(
    @Param('gameName') gameName: string,
    @Body('aiPlayerName') aiPlayerName: string,
  ) {
    const result = await this.gameService.executeAiTurn(gameName, aiPlayerName);
    return {
      message: 'AI turn executed',
      actions: Array.isArray(result) ? result : [result],
    };
  }

  @Post(':gameName/join-with-replacement')
  async joinWithAIReplacement(
    @Param('gameName') gameName: string,
    @Body('username') username: string,
  ) {
    const result = await this.gameService.joinGameWithAIReplacement(
      gameName,
      username,
    );
    this.validateReplacementResult(result);
    return result;
  }

  @Post(':gameName/replace-ai')
  async replaceAI(
    @Param('gameName') gameName: string,
    @Body() body: { originalAI: string; newPlayer: string },
  ) {
    const result = await this.gameService.replaceAIWithPlayer(
      gameName,
      body.originalAI,
      body.newPlayer,
    );
    this.validateReplacementResult(result);
    return result;
  }

  @Post(':gameName/end-round')
  async endRound(@Param('gameName') gameName: string) {
    return await this.gameService.handleRoundEnd(gameName);
  }

  @Post(':gameName/finalize-scores')
  @HttpCode(HttpStatus.OK)
  async finalizeScores(@Param('gameName') gameName: string) {
    return await this.gameService.finalizeAndCalculateScores(gameName);
  }

  @Delete(':gameName/leave/:username')
  @HttpCode(HttpStatus.OK)
  async leaveGame(
    @Param('gameName') gameName: string,
    @Param('username') username: string,
  ) {
    await this.gameService.leaveGame(gameName, username);
    return { message: 'Player left the game' };
  }

  private validateGameCreation(createGameDto: CreateGameDto): void {
    if (createGameDto.maxPlayers < 2 || createGameDto.maxPlayers > 5) {
      throw new BadRequestException('Players must be between 2 and 5');
    }
  }

  private validateReplacementResult(result: ReplacementResult): void {
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
  }
}
