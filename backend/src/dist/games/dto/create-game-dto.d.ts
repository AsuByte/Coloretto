export declare class CreateGameDto {
    gameName: string;
    maxPlayers: number;
    isAiControlled: boolean;
    owner: string;
    players?: string[];
    aiPlayersCount?: number;
    difficultyLevel: 'Basic' | 'Expert';
}
