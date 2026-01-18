import { useState, useEffect, useCallback } from "react";
import { Card, UsePlayerSelectionProps } from "@/types/types";

export const usePlayerSelection = ({
  selectedColumnIndex,
  setSelectedColumnIndex,
  getPlayerCollection,
  getPlayerWildCards,
}: UsePlayerSelectionProps) => {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedPlayerCards, setExpandedPlayerCards] = useState<{
    collection: Card[];
    wild: Card[];
  }>({ collection: [], wild: [] });

  const handlePlayerClick = useCallback(
    (username: string) => {
      if (expandedPlayer === username) {
        setExpandedPlayer(null);
        setExpandedPlayerCards({ collection: [], wild: [] });
      } else {
        setExpandedPlayer(username);

        const collection = getPlayerCollection(username);
        const wild = getPlayerWildCards(username);

        setExpandedPlayerCards({
          collection: Array.isArray(collection) ? collection : [],
          wild: Array.isArray(wild) ? wild : [],
        });
      }
    },
    [expandedPlayer, getPlayerCollection, getPlayerWildCards]
  );

  useEffect(() => {
    const handleClickOutsideColumn = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const isButton =
        target.tagName === "BUTTON" || target.closest("button") !== null;
      const isClickOnAnyColumn = target.closest(".column") !== null;
      const isClickOnActionsArea = target.closest(".gamepage-actions") !== null;

      if (
        !isButton &&
        !isClickOnAnyColumn &&
        !isClickOnActionsArea &&
        selectedColumnIndex !== null
      ) {
        setSelectedColumnIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideColumn);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideColumn);
    };
  }, [selectedColumnIndex, setSelectedColumnIndex]);

  useEffect(() => {
    const handleClickOutsidePlayer = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        expandedPlayer &&
        !target.closest(".player-expanded-overlay") &&
        !target.closest(`.player-card[data-username="${expandedPlayer}"]`)
      ) {
        setExpandedPlayer(null);
        setExpandedPlayerCards({ collection: [], wild: [] });
      }
    };

    document.addEventListener("mousedown", handleClickOutsidePlayer);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsidePlayer);
    };
  }, [expandedPlayer]);

  return {
    expandedPlayer,
    setExpandedPlayer,
    expandedPlayerCards,
    setExpandedPlayerCards,
    handlePlayerClick,
  };
};
