import { useCallback } from "react";
import { GameDetails, Card } from "@/types/types";

export const isGameDetails = (
  game: false | GameDetails | null | undefined
): game is GameDetails => {
  return (
    game !== false &&
    game !== null &&
    game !== undefined &&
    typeof game === "object" &&
    "isFinished" in game
  );
};

export const useGameHelpers = (gameDetails: GameDetails | null) => {
  const getPlayerCollection = useCallback(
    (username: string): Card[] => {
      if (!gameDetails?.playerCollections) return [];
      if (gameDetails.playerCollections instanceof Map) {
        return gameDetails.playerCollections.get(username) || [];
      } else {
        return (
          (gameDetails.playerCollections as Record<string, Card[]>)[username] ||
          []
        );
      }
    },
    [gameDetails]
  );

  const getPlayerWildCards = useCallback(
    (username: string): Card[] => {
      if (!gameDetails?.wildCards) return [];

      if (gameDetails.wildCards instanceof Map) {
        return gameDetails.wildCards.get(username) || [];
      } else {
        return (
          (gameDetails.wildCards as Record<string, Card[]>)[username] || []
        );
      }
    },
    [gameDetails]
  );

  const getPlayerSummaryCards = useCallback(
    (username: string): Card[] => {
      if (!gameDetails?.summaryCards) return [];

      if (gameDetails.summaryCards instanceof Map) {
        return gameDetails.summaryCards.get(username) || [];
      } else {
        return (
          (gameDetails.summaryCards as Record<string, Card[]>)[username] || []
        );
      }
    },
    [gameDetails]
  );

  return {
    getPlayerCollection,
    getPlayerWildCards,
    getPlayerSummaryCards,
  };
};
