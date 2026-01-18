import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { Card, UseGameScoresProps } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { useGameStore } from "@/context/store/GameStore";
import { isGameDetails } from "@/hooks/game/useHelpers";
import {
  calculateColorDistribution,
  countCottonCards,
  calculatePointsForColor,
} from "@/hooks/game/useScore";

export const useGameScores = ({
  gameDetails,
  getGameDetails,
  setGameDetails,
  getPlayerCollection,
  getPlayerWildCards,
  getPlayerSummaryCards,
}: UseGameScoresProps) => {
  const { endScores } = useGameStore();
  const [showScoresOverlay, setShowScoresOverlay] = useState(false);
  const autoScoresShownRef = useRef(false);
  const t = useLanguageStore((state) => state.t);

  const [scoresData, setScoresData] = useState<{
    players: Array<{
      username: string;
      isAI: boolean;
      collectionCards: Card[];
      wildCards: Card[];
      points: number;
      colorDistribution: { [color: string]: number };
      cottonCount: number;
      negativePoints: number;
      negativePointsByColor?: Array<{
        color: string;
        count: number;
        points: number;
      }>;
      summaryType?: string;
      positivePoints?: number;
      topThreeColors?: Array<{ color: string; count: number; points: number }>;
      otherColorsCount?: number;
    }>;
    winner: string[];
    finalScores: { [username: string]: number };
  } | null>(null);

  const getConvertedWildCards = useCallback(
    (username: string) => {
      const wildCards = getPlayerWildCards(username);
      if (!wildCards || wildCards.length === 0) return [];

      const collectionCards = getPlayerCollection(username);
      const colorDistribution = calculateColorDistribution(collectionCards);

      const mostCommonColor =
        Object.entries(colorDistribution)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color)[0] || "brown";

      return wildCards.map((wildCard) => {
        if (wildCard.color !== "wild" && wildCard.color !== "golden_wild") {
          const originalType = wildCard.color ? "golden_wild" : "wild";
          return {
            originalType: originalType,
            convertedColor: wildCard.color,
            isConverted: true,
            count: 1,
          };
        }
        return {
          originalType: wildCard.color,
          convertedColor: mostCommonColor,
          isConverted: false,
          count: 1,
        };
      });
    },
    [getPlayerCollection, getPlayerWildCards]
  );

  const calculateTotalColorDistribution = useCallback(
    (username: string) => {
      const collectionCards = getPlayerCollection(username);
      const distribution = calculateColorDistribution(collectionCards);
      const convertedWilds = getConvertedWildCards(username);

      convertedWilds.forEach((wild) => {
        if (wild.convertedColor) {
          distribution[wild.convertedColor] =
            (distribution[wild.convertedColor] || 0) + 1;
        }
      });

      return distribution;
    },
    [getPlayerCollection, getConvertedWildCards]
  );

  const handleShowScores = useCallback(() => {
    if (!gameDetails || !gameDetails.isFinished || showScoresOverlay) return;

    document.body.classList.add("body-no-scroll");

    const allPlayers = gameDetails.finalScores
      ? Object.keys(gameDetails.finalScores)
      : gameDetails.players || [];

    if (
      gameDetails.finalScores &&
      Object.keys(gameDetails.finalScores).length > 0
    ) {
      const processedPlayers = allPlayers.map((username) => {
        const isAI =
          gameDetails.aiPlayers?.some((ai) => ai.name === username) || false;
        const collectionCards = getPlayerCollection(username);
        const wildCards = getPlayerWildCards(username);
        const summaryCards = getPlayerSummaryCards(username);
        const summaryType = summaryCards[0]?.color || "summary_brown";
        const isBrown = summaryType === "summary_brown";
        const colorDistribution = calculateTotalColorDistribution(username);
        const cottonCount = countCottonCards(collectionCards);

        const sortedColors = Object.entries(colorDistribution).sort(
          (a, b) => b[1] - a[1]
        );

        const topThreeColors = sortedColors
          .slice(0, 3)
          .map(([color, count]) => ({ color, count }));
        const otherColors = sortedColors
          .slice(3)
          .map(([color, count]) => ({ color, count }));

        let positivePoints = 0;
        topThreeColors.forEach(({ count }) => {
          positivePoints += calculatePointsForColor(count, isBrown);
        });
        positivePoints += cottonCount * 2;

        let negativePoints = 0;
        const negativePointsByColor: Array<{
          color: string;
          count: number;
          points: number;
        }> = [];
        otherColors.forEach(({ color, count }) => {
          const points = -calculatePointsForColor(count, isBrown);
          negativePoints += points;
          negativePointsByColor.push({ color, count, points });
        });

        return {
          username,
          isAI,
          collectionCards,
          wildCards,
          summaryType,
          points: gameDetails.finalScores?.[username] || 0,
          colorDistribution,
          cottonCount,
          negativePoints,
          positivePoints,
          topThreeColors: topThreeColors.map(({ color, count }) => ({
            color,
            count,
            points: calculatePointsForColor(count, isBrown),
          })),
          negativePointsByColor,
          otherColorsCount: otherColors.reduce(
            (sum, { count }) => sum + count,
            0
          ),
        };
      });

      setScoresData({
        players: processedPlayers,
        winner: gameDetails.winner || [],
        finalScores: gameDetails.finalScores || {},
      });

      setShowScoresOverlay(true);
    } else {
      endScores(gameDetails.gameName)
        .then(() => {
          getGameDetails(gameDetails.gameName).then((updatedGame) => {
            if (updatedGame && isGameDetails(updatedGame)) {
              setGameDetails(updatedGame);
            }
          });
        })
        .catch((error) => {
          console.error("Error when finalizing scores:", error);
          const message = t("hookShowScores.errorScores");
          toast.error(message);
        });
    }
  }, [
    gameDetails,
    showScoresOverlay,
    getPlayerCollection,
    getPlayerWildCards,
    getPlayerSummaryCards,
    calculateTotalColorDistribution,
    endScores,
    getGameDetails,
    setGameDetails,
    t,
  ]);

  useEffect(() => {
    if (!gameDetails?.isFinished || autoScoresShownRef.current) return;
    const hasScoresData =
      gameDetails.finalScores &&
      Object.keys(gameDetails.finalScores).length > 0;

    if (hasScoresData) {
      localStorage.setItem("reloadProfile", "true");
      autoScoresShownRef.current = true;
      const timer = setTimeout(() => {
        handleShowScores();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        handleShowScores();
      }, 0);
    }
  }, [gameDetails?.isFinished, gameDetails?.finalScores, handleShowScores]);

  useEffect(() => {
    autoScoresShownRef.current = false;
  }, [gameDetails?.gameName]);

  const handleCloseScores = useCallback(() => {
    document.body.classList.remove("body-no-scroll");
    setShowScoresOverlay(false);
    setScoresData(null);
  }, []);

  return {
    showScoresOverlay,
    scoresData,
    handleShowScores,
    handleCloseScores,
    getConvertedWildCards,
  };
};
