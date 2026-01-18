import { useLanguageStore } from "@/context/store/LanguageStore";
import { GameCenterProps } from "@/types/types";
import { getCardImage } from "@/hooks/game/useCardImages";

export const GameCenter: React.FC<GameCenterProps> = ({
  gameDetails,
  selectedColumnIndex,
  handleColumnClick,
  revealingCard,
  columnsContainerRef,
}) => {
  const t = useLanguageStore((state) => state.t);
  return (
    <section className="game-center" aria-label={t("gameCenter.label")}>
      <div
        className="columns-container"
        data-columns={gameDetails.columns.length}
      >
        {gameDetails.columns.map((column, index) => (
          <div
            data-testid={`game-column-${index}`}
            key={index}
            ref={index === 0 ? columnsContainerRef : null}
            className={`column ${
              selectedColumnIndex === index ? "selected" : ""
            } ${column.cards.length === 0 ? "empty" : ""} ${
              revealingCard.isAnimating && revealingCard.targetColumn === index
                ? "receiving-card"
                : ""
            }`}
            onClick={() => handleColumnClick(index)}
          >
            <span className="column-name">
              {t("gameCenter.column")} {index + 1}
            </span>
            <div className="column-cards">
              {column.cards
                .filter((c) => !c.isEndRound && c.color !== "endRound")
                .map((card, cIndex) => (
                  <img
                    key={cIndex}
                    src={getCardImage(card.color)}
                    alt={card.color}
                    className={`card ${
                      cIndex === column.cards.length - 1 ? "last-card" : ""
                    }`}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
