import { ReplacementResult } from '@/types/interfaces';
import { GameService } from '@/games/game.service';
import { CreateGameDto } from '@/games/dto/create-game-dto';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    getAvailableGames(page: number, pageSize: number): Promise<any>;
    getGameByName(gameName: string): Promise<import("./game.schema").GameDocument>;
    getUserGame(owner: string): Promise<import("./game.schema").GameDocument>;
    getReplaceableAIs(gameName: string): Promise<{
        ais: string[];
    }>;
    shouldEndRound(gameName: string): Promise<{
        shouldEndRound: any;
    }>;
    getPreparationTimeRemaining(gameName: string): Promise<{
        timeRemaining: number;
    }>;
    createGame(createGameDto: CreateGameDto): Promise<import("./game.schema").GameDocument>;
    joinGame(body: {
        gameName: string;
        username: string;
    }): Promise<import("./game.schema").GameDocument>;
    createAIGameOnly(body: {
        gameName: string;
        owner: string;
        aiCount: number;
        difficulty: 'Basic' | 'Expert';
    }): Promise<import("./game.schema").GameDocument>;
    prepareGame(gameName: string): Promise<import("./game.schema").GameDocument>;
    selectDifficultyAndPrepareGame(gameName: string, level: 'Basic' | 'Expert'): Promise<import("./game.schema").GameDocument>;
    revealCard(gameName: string, body: {
        playerName: string;
        columnIndex: number;
    }): Promise<{
        success: boolean;
        card?: import("./card/card.schema").Card;
        roundEnded?: boolean;
        keepTurn?: boolean;
        mustPassTurn?: boolean;
        goldenWildAdditionalCard?: import("./card/card.schema").Card;
        goldenWildEndRound?: boolean;
    }>;
    takeColumn(gameName: string, playerName: string, columnIndex: number): Promise<{
        success: boolean;
        takenCards?: import("./card/card.schema").Card[];
        wildCards?: import("./card/card.schema").Card[];
        normalCards?: import("./card/card.schema").Card[];
    } | {
        roundEnded: boolean;
        success: boolean;
        takenCards?: import("./card/card.schema").Card[];
        wildCards?: import("./card/card.schema").Card[];
        normalCards?: import("./card/card.schema").Card[];
    }>;
    aiTurn(gameName: string, aiPlayerName: string): Promise<{
        message: string;
        actions: any[];
    }>;
    joinWithAIReplacement(gameName: string, username: string): Promise<ReplacementResult>;
    replaceAI(gameName: string, body: {
        originalAI: string;
        newPlayer: string;
    }): Promise<ReplacementResult>;
    endRound(gameName: string): Promise<any>;
    finalizeScores(gameName: string): Promise<any>;
    leaveGame(gameName: string, username: string): Promise<{
        message: string;
    }>;
    private validateGameCreation;
    private validateReplacementResult;
}
