import { useState, useRef, useCallback, useEffect } from "react";
import { GameDetails, UseGameReassignmentProps } from "@/types/types";
import { isGameDetails } from "@/hooks/game/useHelpers";

export const useGameReassignment = ({
  selectedGame,
  getGameDetails,
  setGameDetails,
}: UseGameReassignmentProps) => {
  const [isReassigningColumns, setIsReassigningColumns] = useState(false);
  const [reassignmentMessage, setReassignmentMessage] = useState("");
  const reassignmentTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleReassignmentStarting = useCallback(
    (data: {
      gameName: string;
      message: string;
      duration: number;
      round: number;
    }) => {
      if (data.gameName !== selectedGame) return;
      setIsReassigningColumns(true);
      setReassignmentMessage(data.message);

      if (reassignmentTimerRef.current) {
        clearTimeout(reassignmentTimerRef.current);
      }

      reassignmentTimerRef.current = setTimeout(() => {
        setIsReassigningColumns(false);
        setReassignmentMessage("");
        reassignmentTimerRef.current = null;
      }, data.duration);
    },
    [selectedGame]
  );

  const handleReassignmentComplete = useCallback(
    async (data: { gameName: string; game: GameDetails; round: number }) => {
      if (data.gameName !== selectedGame) return;

      setIsReassigningColumns(false);
      setReassignmentMessage("");

      try {
        const updatedGame = await getGameDetails(selectedGame);
        if (updatedGame && isGameDetails(updatedGame)) {
          setGameDetails(updatedGame);
        } else if (data.game) {
          setGameDetails(data.game);
        }
      } catch (error) {
        console.error(error);
        if (data.game) setGameDetails(data.game);
      }

      if (reassignmentTimerRef.current) {
        clearTimeout(reassignmentTimerRef.current);
        reassignmentTimerRef.current = null;
      }
    },
    [selectedGame, getGameDetails, setGameDetails]
  );

  useEffect(() => {
    return () => {
      if (reassignmentTimerRef.current) {
        clearTimeout(reassignmentTimerRef.current);
      }
    };
  }, []);

  return {
    isReassigningColumns,
    reassignmentMessage,
    handleReassignmentStarting,
    handleReassignmentComplete,
  };
};
