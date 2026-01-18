import { Card, Column } from '@/games/card/card.schema';
export declare class DeckService {
    createDeck(numberOfPlayers: number): Promise<Card[]>;
    setupColumnsAndDeck(deck: Card[], numberOfPlayers: number): [Column[], Card[]];
    shuffleArray<T>(array: T[]): T[];
    chooseStartingPlayer(players: string[]): number;
    getUniqueChameleonColor(): string;
    getUniqueChameleonColors(count: number): string[];
}
