import { useCallback } from "react";
import { GameDetails, Card, UseCardRevealedProps } from "@/types/types";

export const useCardRevealed = ({
  gameName,
  getGameDetails,
  setGameDetails,
  handleEndRoundCard,
  ignoreAI = false,
}: UseCardRevealedProps) => {
  const handleCardRevealed = useCallback(
    async (data: unknown) => {
      try {
        if (
          typeof data === "object" &&
          data !== null &&
          "revealedCard" in data
        ) {
          const eventData = data as {
            game?: GameDetails;
            revealedCard?: Card;
            playerName?: string;
            isAI?: boolean;
          };

          const revealedCard = eventData.revealedCard;

          if (
            revealedCard &&
            (revealedCard.isEndRound === true ||
              revealedCard.color === "endRound")
          ) {
            if (eventData.game) {
              setGameDetails(eventData.game);
            }

            handleEndRoundCard();
            return;
          }

          if (ignoreAI) {
            if (
              eventData.isAI === true ||
              eventData.playerName?.includes("IA") ||
              eventData.playerName?.includes("AI")
            ) {
              return;
            }
          }

          if (eventData.game) {
            setGameDetails(eventData.game);
          } else if (!eventData.game && gameName) {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const updatedGame = await getGameDetails(gameName);
            if (updatedGame) {
              setGameDetails(updatedGame);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [gameName, getGameDetails, setGameDetails, handleEndRoundCard, ignoreAI]
  );

  return handleCardRevealed;
};
