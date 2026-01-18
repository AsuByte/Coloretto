import { useState, useRef, useCallback, useEffect } from "react";
import { UseGamePreparationProps } from "@/types/types";
import { isGameDetails } from "@/hooks/game/useHelpers";

export const useGamePreparation = ({
  gameName,
  getGameDetails,
  setGameDetails,
}: UseGamePreparationProps) => {
  const [preparationCountdown, setPreparationCountdown] = useState<
    number | null
  >(null);
  const [isAutoPreparing, setIsAutoPreparing] = useState(false);
  const preparationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePreparationStarted = useCallback(
    (data: {
      difficulty: "Basic" | "Expert";
      gameName: string;
      preparationTime: number;
    }) => {
      if (data.gameName !== gameName) return;
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
        preparationTimerRef.current = null;
      }

      setIsAutoPreparing(true);
      let countdown = 5;
      setPreparationCountdown(countdown);

      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setPreparationCountdown(countdown);
        } else if (countdown === 0) {
          setPreparationCountdown(0);
        } else if (countdown < 0) {
          clearInterval(interval);
          setPreparationCountdown(null);

          setTimeout(() => {
            setIsAutoPreparing(false);

            setTimeout(() => {
              if (gameName) {
                getGameDetails(gameName).then((updatedGame) => {
                  if (updatedGame && isGameDetails(updatedGame)) {
                    setGameDetails(updatedGame);
                  }
                });
              }
            }, 500);
          }, 3000);
        }
      }, 1000);

      preparationTimerRef.current = interval;
    },
    [gameName, getGameDetails, setGameDetails]
  );

  useEffect(() => {
    return () => {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    };
  }, []);

  return {
    preparationCountdown,
    isAutoPreparing,
    handlePreparationStarted,
  };
};
