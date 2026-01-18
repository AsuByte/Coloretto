import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { UseGameSyncProps } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { isGameDetails } from "@/hooks/game/useHelpers";

export const useGameSync = ({
  gameName,
  selectedGame,
  getGameDetails,
  setGameDetails,
  setShowScoreTable,
  showEndRoundOverlay = false,
}: UseGameSyncProps) => {
  const t = useLanguageStore((state) => state.t);
  const handleGameUpdated = useCallback(async () => {
    if (!selectedGame && !gameName) return;

    if (showEndRoundOverlay) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const targetGame = selectedGame || gameName || "";
      if (!targetGame) return;
      const updatedGame = await getGameDetails(targetGame);

      if (updatedGame && isGameDetails(updatedGame)) {
        setGameDetails(updatedGame);
      } else {
        console.warn("Game not found in handleGameUpdated:", targetGame);
      }
    } catch (error) {
      console.error("Error in handleGameUpdated:", error);
    }
  }, [
    selectedGame,
    gameName,
    showEndRoundOverlay,
    getGameDetails,
    setGameDetails,
  ]);

  const handleGameFinalized = useCallback(async () => {
    const targetGame = selectedGame || gameName;
    if (!targetGame) return;

    try {
      const updatedGameDetails = await getGameDetails(targetGame);

      if (isGameDetails(updatedGameDetails) && updatedGameDetails.isFinished) {
        const message = t("hookSync.end");
        toast.success(message);
        setShowScoreTable(true);
        setGameDetails(updatedGameDetails);
      }
    } catch (error) {
      console.error("Error in handleGameFinalized:", error);
    }
  }, [
    selectedGame,
    gameName,
    getGameDetails,
    setGameDetails,
    setShowScoreTable,
    t
  ]);

  return {
    handleGameUpdated,
    handleGameFinalized,
  };
};
