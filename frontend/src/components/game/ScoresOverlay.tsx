import { useLanguageStore } from "@/context/store/LanguageStore";
import { getCardImage } from "@/hooks/game/useCardImages";
import { ScoresOverlayProps } from "@/types/types";
import trophy from "@/assets/winner/trophy.webp";

export const ScoresOverlay: React.FC<ScoresOverlayProps> = ({
  scoresData,
  onClose,
  onZoom,
  contentRef,
  getConvertedWildCards,
}) => {
  const t = useLanguageStore((state) => state.t);
  return (
    <section className="scores-overlay" data-testid="overlay-game-over" role="dialog">
      <div className="scores-container">
        <header className="scores-header">
          <h2>{t("gameScoresOverlay.finalScores")}</h2>
          <div className="scores-summary-card-image">
            {(() => {
              const firstPlayer = scoresData.players[0];
              const summaryType = firstPlayer?.summaryType || "summary_brown";
              return (
                <div className="summary-card-display" onClick={onZoom}>
                  <img
                    src={getCardImage(summaryType)}
                    alt={`${summaryType}`}
                    className="scores-summary-img"
                  />
                  <div className="summary-card-label">
                    {t("gameSidebar.summaryCards")}
                  </div>
                </div>
              );
            })()}
          </div>
          <button className="scores-close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="scores-table-wrapper" ref={contentRef}>
          <div className="scores-table">
            <div className="scores-table-header">
              <span className="scores-table-col players-col">
                {t("gameScoresOverlay.player")}
              </span>
              <span className="scores-table-col cards-col">
                {t("gameScoresOverlay.card")}
              </span>
              <span className="scores-table-col points-col">
                {t("gameScoresOverlay.point")}
              </span>
            </div>

            <div className="scores-table-body">
              {scoresData.players.map((player) => (
                <div
                  key={player.username}
                  className={`scores-table-row ${
                    scoresData.winner.includes(player.username)
                      ? "winner-row"
                      : ""
                  } ${player.isAI ? "ai-player-row" : ""}`}
                  role="row"
                >
                  <div className="scores-table-col players-col">
                    <div className="scores-player-info">
                      <span className="scores-player-name">
                        {player.username} {player.isAI}
                      </span>
                      {scoresData.winner.includes(player.username) && (
                        <div className="scores-winner-badge">
                          <img
                            alt={t("gameScoresOverlay.trophy")}
                            src={trophy}
                          />{" "}
                          {t("gameScoresOverlay.winner")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="scores-table-col cards-col">
                    <div className="scores-player-cards-section">
                      <div className="scores-collection-cards">
                        {Object.entries(player.colorDistribution)
                          .sort((a, b) => b[1] - a[1])
                          .map(([color, count]) => (
                            <div key={color} className="scores-color-group">
                              <div className="scores-color-count">{count}x</div>
                              <img
                                src={getCardImage(color)}
                                alt={color}
                                className="scores-color-card"
                              />
                            </div>
                          ))}
                        {player.cottonCount > 0 && (
                          <div className="scores-color-group">
                            <div className="scores-color-count">
                              {player.cottonCount}x
                            </div>
                            <img
                              src={getCardImage("cotton")}
                              alt={t("gameScoresOverlay.cotton")}
                              className="scores-color-card"
                            />
                          </div>
                        )}
                      </div>

                      {player.wildCards.length > 0 && (
                        <div className="scores-wild-cards">
                          <div className="scores-wild-section">
                            <div className="scores-wild-converted">
                              {getConvertedWildCards(player.username).map(
                                (wild, index: number) => (
                                  <div
                                    key={index}
                                    className="wild-conversion-pair"
                                  >
                                    <img
                                      src={getCardImage(wild.originalType)}
                                      alt={t("gamePlayers.wild")}
                                      className="scores-wild-card original"
                                    />
                                    <span className="conversion-arrow">→</span>
                                    <img
                                      src={getCardImage(wild.convertedColor)}
                                      alt={t("gameScoresOverlay.converted")}
                                      className="scores-wild-card converted"
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="scores-table-col points-col">
                    <div className="scores-points-breakdown">
                      {player.topThreeColors?.map(
                        ({ color, count, points }) => (
                          <div
                            key={color}
                            className="scores-points-item scores-top-color"
                          >
                            <span className="scores-points-count">
                              {count}x
                            </span>
                            <span className="scores-points-color">{t(`gameScoresOverlay.colors.${color}`)}</span>
                            <span className="scores-points-value">
                              +{points} {t("gameScoresOverlay.points")}
                            </span>
                          </div>
                        )
                      )}
                      {player.negativePointsByColor?.map(
                        ({ color, count, points }) => (
                          <div
                            key={color}
                            className="scores-points-item scores-negative-points"
                          >
                            <span className="scores-points-count">
                              {count}x
                            </span>
                            <span className="scores-points-color">{t(`gameScoresOverlay.colors.${color}`)}</span>
                            <span className="scores-points-value">
                              {points} {t("gameScoresOverlay.points")}
                            </span>
                          </div>
                        )
                      )}
                      {player.cottonCount > 0 && (
                        <div className="scores-points-item scores-cotton-points">
                          <span className="scores-points-count">
                            {player.cottonCount}x
                          </span>
                          <span className="scores-points-color">
                            {t("gameScoresOverlay.cottons")}
                          </span>
                          <span className="scores-points-value">
                            +{player.cottonCount * 2}{" "}
                            {t("gameScoresOverlay.points")}
                          </span>
                        </div>
                      )}
                      <div className="scores-points-total">
                        <span className="scores-total-label">Total:</span>
                        <span className="scores-total-value">
                          {player.points} {t("gameScoresOverlay.points")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
