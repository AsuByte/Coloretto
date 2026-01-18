import { Card } from "@/types/types";

export const calculateColorDistribution = (cards: Card[]) => {
  const distribution: { [color: string]: number } = {};

  cards.forEach((card) => {
    if (
      card.color === "cotton" ||
      card.color.startsWith("brown_column") ||
      card.color.startsWith("green_column") ||
      card.color === "wild" ||
      card.color === "golden_wild" ||
      card.color === "endRound" ||
      card.color.startsWith("summary")
    ) {
      return;
    }

    const color = card.color;
    if (
      color &&
      !color.includes("summary") &&
      color !== "endRound" &&
      color !== "deck"
    ) {
      distribution[color] = (distribution[color] || 0) + 1;
    }
  });

  return distribution;
};

export const countCottonCards = (cards: Card[]) => {
  return cards.filter((card) => card.color === "cotton").length;
};

export const calculatePointsForColor = (count: number, isBrown: boolean) => {
  const effectiveCount = Math.min(count, 6);

  if (isBrown) {
    switch (effectiveCount) {
      case 1:
        return 1;
      case 2:
        return 3;
      case 3:
        return 6;
      case 4:
        return 10;
      case 5:
        return 15;
      case 6:
        return 21;
      default:
        return 0;
    }
  } else {
    switch (effectiveCount) {
      case 1:
        return 1;
      case 2:
        return 4;
      case 3:
        return 8;
      case 4:
        return 7;
      case 5:
        return 6;
      case 6:
        return 5;
      default:
        return 0;
    }
  }
};
