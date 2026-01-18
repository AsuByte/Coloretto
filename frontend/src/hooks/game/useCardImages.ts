import summary_brown from "@/assets/cards/summary_brown.webp";
import summary_violet from "@/assets/cards/summary_violet.webp";
import brown_column from "@/assets/cards/brown_column.webp";
import green_column_0 from "@/assets/cards/green_column_0.webp";
import green_column_1 from "@/assets/cards/green_column_1.webp";
import green_column_2 from "@/assets/cards/green_column_2.webp";
import chameleonBlue from "@/assets/cards/chameleonBlue.webp";
import chameleonBrown from "@/assets/cards/chameleonBrown.webp";
import chameleonGreen from "@/assets/cards/chameleonGreen.webp";
import chameleonPurple from "@/assets/cards/chameleonPurple.webp";
import chameleonYellow from "@/assets/cards/chameleonYellow.webp";
import chameleonRed from "@/assets/cards/chameleonRed.webp";
import chameleonOrange from "@/assets/cards/chameleonOrange.webp";
import cotton from "@/assets/cards/cotton.webp";
import wild from "@/assets/cards/wild.webp";
import golden_wild from "@/assets/cards/golden_wild.webp";
import endRound from "@/assets/cards/endRound.webp";
import reverse from "@/assets/cards/reverse.webp";

export const getCardImage = (cardType: string): string => {
  const cardImages: { [key: string]: string } = {
    summary_brown: summary_brown,
    summary_violet: summary_violet,

    green_column_0: green_column_0,
    green_column_1: green_column_1,
    green_column_2: green_column_2,
    brown_column: brown_column,

    red: chameleonRed,
    blue: chameleonBlue,
    yellow: chameleonYellow,
    green: chameleonGreen,
    purple: chameleonPurple,
    orange: chameleonOrange,
    brown: chameleonBrown,

    golden_wild: golden_wild,
    wild: wild,
    cotton: cotton,
    endRound: endRound,

    deck: reverse,
  };

  return cardImages[cardType] || reverse;
};
