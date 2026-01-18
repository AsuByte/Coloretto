import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UsePlayerActionsProps } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { useGameStore } from "@/context/store/GameStore";
import axios from "axios";

export const usePlayerActions = ({
  gameDetails,
  selectedGame,
  user,
  selectedColumnIndex,
  setSelectedColumnIndex,
  isCurrentPlayerTurn,
  isRoundEndAnimationBlocking,
  showEndRoundOverlay,
  setGameDetails,
  getGameDetails,
}: UsePlayerActionsProps) => {
  const navigate = useNavigate();
  const { revealCard, takeColumn, leaveGame, fetchGames } = useGameStore();
  const t = useLanguageStore((state) => state.t);
  const [animationState, setAnimationState] = useState<
    "reveal" | "take" | null
  >(null);
  const isAnimationActive = animationState !== null;

  const isTakingColumnRef = useRef(false);

  const handleColumnClick = useCallback(
    (index: number) => {
      const column = gameDetails?.columns[index];
      if (!column || column.cards.length === 0) {
        return;
      }
      setSelectedColumnIndex(index);
    },
    [gameDetails, setSelectedColumnIndex]
  );

  const handleRevealCard = useCallback(async () => {
    if (!user || !selectedGame || selectedColumnIndex === null) return;

    if (animationState || isRoundEndAnimationBlocking || showEndRoundOverlay) {
      return;
    }

    const targetColumn = gameDetails?.columns[selectedColumnIndex];

    if (targetColumn) {
      const hasGoldenWild = targetColumn.cards.some(
        (c) => c.color === "golden_wild"
      );

      const maxCards = hasGoldenWild ? 5 : 4;

      if (targetColumn.cards.length >= maxCards) {
        return;
      }
    }

    try {
      setAnimationState("reveal");

      const deckCard = document.querySelector(
        ".deck-card:first-child"
      ) as HTMLElement;

      if (!deckCard) {
        await revealCard(selectedGame, user.username, selectedColumnIndex);
        setAnimationState(null);
        return;
      }

      const deckContainer = document.querySelector(
        ".deck-stack"
      ) as HTMLElement;
      if (!deckContainer) return;

      const deckRect = deckCard.getBoundingClientRect();

      const cloneCard = deckCard.cloneNode(true) as HTMLElement;
      cloneCard.style.cssText = window.getComputedStyle(deckCard).cssText;
      cloneCard.style.position = "absolute";
      cloneCard.style.left = `${deckRect.left}px`;
      cloneCard.style.top = `${deckRect.top}px`;
      cloneCard.style.width = `${deckRect.width}px`;
      cloneCard.style.height = `${deckRect.height}px`;
      cloneCard.style.zIndex = "10000";
      cloneCard.style.transition = "all 0.8s ease";
      cloneCard.style.opacity = "1";
      cloneCard.style.pointerEvents = "none";

      deckCard.style.opacity = "0.7";
      document.body.appendChild(cloneCard);

      const columnElement = document.querySelector(
        `.column:nth-child(${selectedColumnIndex + 1}) .column-cards`
      ) as HTMLElement;

      const columnRect = columnElement?.getBoundingClientRect();

      if (columnRect) {
        const targetX = columnRect.left + columnRect.width / 2 - deckRect.left;
        const targetY = columnRect.top + columnRect.height / 2 - deckRect.top;

        setTimeout(() => {
          cloneCard.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.5)`;
          cloneCard.style.opacity = "0";

          setTimeout(async () => {
            await revealCard(selectedGame, user.username, selectedColumnIndex);
            deckCard.style.opacity = "";
            if (cloneCard.parentNode)
              cloneCard.parentNode.removeChild(cloneCard);
            setAnimationState(null);
          }, 700);
        }, 100);
      } else {
        await revealCard(selectedGame, user.username, selectedColumnIndex);
        deckCard.style.opacity = "";
        if (cloneCard.parentNode) cloneCard.parentNode.removeChild(cloneCard);
        setAnimationState(null);
      }
    } catch (error) {
      console.error("Error in revealCard:", error);
      setAnimationState(null);
    }
  }, [
    user,
    selectedGame,
    selectedColumnIndex,
    animationState,
    isRoundEndAnimationBlocking,
    showEndRoundOverlay,
    gameDetails?.columns,
    revealCard,
  ]);

  const handleTakeColumn = useCallback(async () => {
    if (!user || !selectedGame) {
      const message = t("hookPlayerActions.logged");
      toast.error(message);
      return;
    }

    if (selectedColumnIndex === null) {
      const message = t("hookPlayerActions.noColumnSelected");
      toast.error(message);
      return;
    }

    if (!isCurrentPlayerTurn()) {
      const message = t("hookPlayerActions.turn");
      toast.error(message);
      return;
    }

    if (
      isAnimationActive ||
      isRoundEndAnimationBlocking ||
      showEndRoundOverlay
    ) {
      return;
    }

    try {
      isTakingColumnRef.current = true;
      setAnimationState("take");
      setSelectedColumnIndex(null);

      const column = gameDetails?.columns[selectedColumnIndex];
      if (!column || column.cards.length === 0) {
        setAnimationState(null);
        return;
      }

      const currentUserPlayerCard = document.querySelector(
        `.player-card.current-user`
      ) as HTMLElement;
      if (!currentUserPlayerCard) {
        await takeColumn(selectedGame, user.username, selectedColumnIndex);
        setAnimationState(null);
        return;
      }

      const playerRect = currentUserPlayerCard.getBoundingClientRect();
      const columnCards = document.querySelectorAll(
        `.column:nth-child(${selectedColumnIndex + 1}) .card`
      );

      const animationPromises = Array.from(columnCards).map(
        (cardElement, index) => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              const card = cardElement as HTMLElement;
              const cardRect = card.getBoundingClientRect();

              const flyingCard = document.createElement("div");
              flyingCard.className = "card-fly-to-player-absolute";
              flyingCard.style.position = "absolute";
              flyingCard.style.left = `${cardRect.left}px`;
              flyingCard.style.top = `${cardRect.top}px`;
              flyingCard.style.width = `${cardRect.width}px`;
              flyingCard.style.height = `${cardRect.height}px`;

              const cardImg = card as HTMLImageElement;
              flyingCard.style.backgroundImage = `url(${cardImg.src})`;
              flyingCard.style.backgroundSize = "cover";
              flyingCard.style.backgroundPosition = "center";
              flyingCard.style.zIndex = "9999";
              flyingCard.style.transition =
                "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)";

              document.body.appendChild(flyingCard);

              card.style.opacity = "0.3";
              card.style.transform = "scale(0.8)";

              const randomX = Math.random() * (playerRect.width - 40);
              const randomY = Math.random() * (playerRect.height - 60);
              const targetX = playerRect.left + randomX;
              const targetY = playerRect.top + randomY;

              const translateX = targetX - cardRect.left;
              const translateY = targetY - cardRect.top;

              setTimeout(() => {
                flyingCard.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.6)`;
                flyingCard.style.opacity = "0.7";

                setTimeout(() => {
                  if (flyingCard.parentNode) {
                    flyingCard.parentNode.removeChild(flyingCard);
                  }
                  resolve();
                }, 700);
              }, 50);
            }, index * 150);
          });
        }
      );

      await Promise.all(animationPromises);

      await takeColumn(selectedGame, user.username, selectedColumnIndex);

      setGameDetails((prev) => {
        if (!prev) return prev;
        const newColumns = [...prev.columns];
        if (newColumns[selectedColumnIndex]) {
          newColumns[selectedColumnIndex] = {
            ...newColumns[selectedColumnIndex],
            cards: [],
          };
        }
        return { ...prev, columns: newColumns };
      });

      setTimeout(async () => {
        const updatedGame = await getGameDetails(selectedGame);
        if (updatedGame) {
          setGameDetails(updatedGame);
        }
        setAnimationState(null);
        isTakingColumnRef.current = false;
      }, 500);
    } catch {
      const errorMessage = t("hookPlayerActions.errorColumn");
      toast.error(errorMessage);
      setAnimationState(null);
      isTakingColumnRef.current = false;
    }
  }, [
    user,
    selectedGame,
    selectedColumnIndex,
    gameDetails,
    isCurrentPlayerTurn,
    isAnimationActive,
    isRoundEndAnimationBlocking,
    showEndRoundOverlay,
    setSelectedColumnIndex,
    takeColumn,
    setGameDetails,
    getGameDetails,
    t,
  ]);

  const handleLeaveGame = useCallback(async () => {
    if (!user || !selectedGame) {
      toast.error("You need to be logged in to leave a game.");
      return;
    }

    try {
      await leaveGame(selectedGame, user.username);
      setSelectedColumnIndex(null);
      navigate("/play/join");
      await fetchGames();
    } catch (error: unknown) {
      let errorMessage = "Error leaving game";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      console.error("Error leaving game:", error);
    }
  }, [
    user,
    selectedGame,
    leaveGame,
    navigate,
    fetchGames,
    setSelectedColumnIndex,
  ]);

  return {
    handleColumnClick,
    handleRevealCard,
    handleTakeColumn,
    handleLeaveGame,
    isAnimationActive,
    animationState,
    isTakingColumnRef,
  };
};
