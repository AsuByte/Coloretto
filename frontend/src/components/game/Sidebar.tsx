import { useLanguageStore } from "@/context/store/LanguageStore";
import { GameSidebarProps } from "@/types/types";
import { getCardImage } from "@/hooks/game/useCardImages";

export const GameSidebar: React.FC<GameSidebarProps> = ({
  gameDetails,
  endRoundCardInSidebar,
  getSummaryCardClass,
  getPlayerSummaryCards,
  totalPlayers,
}) => {
  const t = useLanguageStore((state) => state.t);
  return (
    <aside className="game-sidebar" aria-label={t("gameSidebar.label")}>
      <section className="deck-section" aria-label={t("gameSidebar.deck")}>
        <div
          className="deck-stack"
          aria-hidden="true"
          data-testid="sidebar-deck"
        >
          {gameDetails.deck.slice(0, 10).map((_, index) => (
            <img
              key={index}
              src={getCardImage("deck")}
              className="deck-card"
              style={{
                transform: `translateY(${index * 5}px)`,
                opacity: Math.max(0, 1 - index * 0.45),
                zIndex: gameDetails.deck.length - index,
              }}
            />
          ))}
        </div>
        <div className="deck-count">
          {gameDetails.deck.length} {t("gameSidebar.cards")}
        </div>
      </section>

      <section
        data-testid="sidebar-summary"
        className={`summary-section ${getSummaryCardClass()}`}
      >
        <h4>{t("gameSidebar.summaryCards")}</h4>
        <div className="summary-cards">
          {(() => {
            const firstPlayer = Object.keys(gameDetails.summaryCards || {})[0];
            const summaryCard = getPlayerSummaryCards(firstPlayer)[0];
            return summaryCard ? (
              <img
                src={getCardImage(summaryCard.color)}
                alt={t("gameSidebar.summaryCards")}
                className="card"
              />
            ) : (
              <div className="empty-summary">{t("gameSidebar.noSummary")}</div>
            );
          })()}
        </div>
      </section>

      <section
        className={`end-round-section ${
          endRoundCardInSidebar ? "visible" : ""
        }`}
        id="end-round-slot"
      >
        <h4>{t("gameSidebar.endRound")}</h4>
        {endRoundCardInSidebar ? (
          <img
            src={getCardImage("endRound")}
            alt={t("gameSidebar.endRound")}
            data-testid="img-end-round-active"
            className="end-round-card"
          />
        ) : (
          <div
            className="end-round-placeholder"
            id="end-round-placeholder"
          ></div>
        )}
      </section>

      <section className="game-info-section">
        <h4>{t("gameSidebar.info")}</h4>
        <dl className="info-grid">
          <div className="info-item">
            <dt className="info-label">{t("gameScoresOverlay.player")}</dt>
            <dd className="info-value">{totalPlayers}</dd>
          </div>
          <div className="info-item">
            <dt className="info-label">{t("gameSidebar.round")}</dt>
            <dd className="info-value">{gameDetails.currentRound}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
};
