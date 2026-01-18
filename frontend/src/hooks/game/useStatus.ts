import { useCallback, useEffect } from "react";
import { UseGameStatusProps } from "@/types/types";

export const useGameStatus = ({
  gameDetails,
  user,
  selectedColumnIndex,
  setSelectedColumnIndex,
  getPlayerSummaryCards,
}: UseGameStatusProps) => {
  const getSummaryCardClass = useCallback(() => {
    const summaryCards = gameDetails?.summaryCards;
    if (!summaryCards || Object.keys(summaryCards).length === 0) return "";

    const firstPlayer = Object.keys(summaryCards)[0];
    const summaryCard = getPlayerSummaryCards(firstPlayer)[0];

    if (!summaryCard) return "";

    return summaryCard.color === "summary_violet"
      ? "summary_violet"
      : "summary_brown";
  }, [gameDetails, getPlayerSummaryCards]);

  const getAllPlayers = useCallback(() => {
    if (!gameDetails) return [];

    const humanPlayers = gameDetails.players || [];
    const aiPlayers = gameDetails.aiPlayers?.map((ai) => ai.name) || [];

    return [...humanPlayers, ...aiPlayers];
  }, [gameDetails]);

  const isCurrentPlayerTurn = useCallback(() => {
    if (!gameDetails || !user) return false;

    const allPlayers = getAllPlayers();
    if (allPlayers.length === 0) return false;

    const currentPlayerIndex = gameDetails.currentPlayerIndex;
    if (currentPlayerIndex < 0 || currentPlayerIndex >= allPlayers.length)
      return false;

    const currentPlayer = allPlayers[currentPlayerIndex];
    return currentPlayer === user.username;
  }, [gameDetails, user, getAllPlayers]);

  useEffect(() => {
    if (!isCurrentPlayerTurn() && selectedColumnIndex !== null) {
      setSelectedColumnIndex(null);
    }
  }, [isCurrentPlayerTurn, selectedColumnIndex, setSelectedColumnIndex]);

  return {
    getSummaryCardClass,
    getAllPlayers,
    isCurrentPlayerTurn,
  };
};
