import { useState, useCallback } from "react";
import { GameDetails } from "@/types/types";

export const useEndRoundAnimation = (
  selectedGame: string,
  getGameDetails: (gameName: string) => Promise<GameDetails | false>,
  setGameDetails: React.Dispatch<React.SetStateAction<GameDetails | null>>
) => {
  const [isRoundEndAnimationBlocking, setIsRoundEndAnimationBlocking] =
    useState(false);
  const [showEndRoundOverlay, setShowEndRoundOverlay] = useState(false);
  const [endRoundCardInSidebar, setEndRoundCardInSidebar] = useState(false);

  const handleEndRoundCard = useCallback(() => {
    setIsRoundEndAnimationBlocking(true);
    setShowEndRoundOverlay(true);

    setTimeout(() => {
      const overlayCard = document.querySelector(".final-card-overlay img");
      if (!overlayCard) {
        setShowEndRoundOverlay(false);
        setEndRoundCardInSidebar(true);
        setIsRoundEndAnimationBlocking(false);
        return;
      }

      const overlayRect = overlayCard.getBoundingClientRect();

      let targetElement;

      if (endRoundCardInSidebar) {
        targetElement = document.querySelector(".end-round-card");
      } else {
        targetElement = document.querySelector(".end-round-placeholder");
      }
      if (!targetElement) {
        targetElement = document.getElementById("end-round-slot");
      }

      if (!targetElement) {
        console.error("The target element was not found");
        setShowEndRoundOverlay(false);
        setEndRoundCardInSidebar(true);
        setIsRoundEndAnimationBlocking(false);
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const flyingCard = document.createElement("div");
      flyingCard.className = "card-fly-to-sidebar";
      flyingCard.style.position = "fixed";
      flyingCard.style.left = `${overlayRect.left}px`;
      flyingCard.style.top = `${overlayRect.top}px`;
      flyingCard.style.width = `${overlayRect.width}px`;
      flyingCard.style.height = `${overlayRect.height}px`;

      const imgElement = overlayCard as HTMLImageElement;
      flyingCard.style.backgroundImage = `url(${imgElement.src})`;

      flyingCard.style.backgroundSize = "cover";
      flyingCard.style.backgroundPosition = "center";
      flyingCard.style.zIndex = "10001";
      flyingCard.style.pointerEvents = "none";

      document.body.appendChild(flyingCard);

      const startCenterX = overlayRect.left + overlayRect.width / 2;
      const startCenterY = overlayRect.top + overlayRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      const translateX = targetCenterX - startCenterX;
      const translateY = targetCenterY - startCenterY;

      setTimeout(() => {
        flyingCard.style.transition =
          "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
        flyingCard.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.35)`;
        flyingCard.style.opacity = "0.9";

        const endRoundSection = document.querySelector(".end-round-section");
        if (endRoundSection) {
          endRoundSection.classList.add("receiving-card");
        }

        setTimeout(() => {
          if (flyingCard.parentNode) {
            flyingCard.parentNode.removeChild(flyingCard);
          }

          if (endRoundSection) {
            endRoundSection.classList.remove("receiving-card");
          }

          setShowEndRoundOverlay(false);
          setEndRoundCardInSidebar(true);
          setIsRoundEndAnimationBlocking(false);
        }, 1200);
      }, 100);
    }, 2000);

    setTimeout(async () => {
      if (selectedGame) {
        const updatedGame = await getGameDetails(selectedGame);
        if (updatedGame) {
          setGameDetails(updatedGame);
        }
      }
    }, 3500);
  }, [endRoundCardInSidebar, selectedGame, getGameDetails, setGameDetails]);

  return {
    handleEndRoundCard,
    isRoundEndAnimationBlocking,
    showEndRoundOverlay,
    endRoundCardInSidebar,
    setEndRoundCardInSidebar,
  };
};
