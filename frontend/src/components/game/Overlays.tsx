import { useLanguageStore } from "@/context/store/LanguageStore";
import { GameOverlaysProps } from "@/types/types";
import { getCardImage } from "@/hooks/game/useCardImages";

export const GameOverlays: React.FC<GameOverlaysProps> = ({
  preparationCountdown,
  isAutoPreparing,
  showEndRoundOverlay,
  expandedPlayer,
  expandedPlayerCards,
  onCloseExpanded,
  isCardZoomed,
  onCloseZoom,
  zoomCardType,
}) => {
  const t = useLanguageStore((state) => state.t);
  return (
    <>
      {(preparationCountdown !== null || isAutoPreparing) && (
        <section
          className="countdown-overlay"
          role="alert"
          aria-live="assertive"
        >
          <div className="flying-cards">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flying-card"></div>
            ))}
          </div>
          <div className="countdown-container">
            {preparationCountdown !== null && preparationCountdown > 0 ? (
              <>
                <h2>{t("gameOverlays.countDownTitle")}</h2>
                <div className="countdown-number">{preparationCountdown}</div>
                <p>{t("gameOverlays.countDownSubtitle")}</p>
              </>
            ) : (
              <>
                <h3>{t("gameOverlays.countDownCards")}</h3>
                <p>{t("gameOverlays.countDownCardsTwo")}</p>
                <div className="card-loading">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="loading-card"></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {showEndRoundOverlay && (
        <section className="final-card-overlay" role="alert">
          <div className="final-card-container">
            <img
              src={getCardImage("endRound")}
              alt={t("gameOverlays.endRoundRevealed")}
            />
            <h2 className="final-card-title">
              {t("gameOverlays.endRoundRevealed")}
            </h2>
          </div>
        </section>
      )}

      {expandedPlayer && (
        <section
          className="player-expanded-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={expandedPlayer}
        >
          <div className="player-expanded-container">
            <div className="expanded-header">
              <h3>{expandedPlayer}</h3>
              <button className="close-expanded" onClick={onCloseExpanded}>
                ×
              </button>
            </div>
            <div className="expanded-sections">
              <div className="expanded-section">
                <h4>
                  {t("gameOverlays.collection")} (
                  {expandedPlayerCards.collection.length})
                </h4>
                <div className="expanded-cards-grid">
                  {expandedPlayerCards.collection.map((card, index) => (
                    <img
                      key={`col-${index}`}
                      src={getCardImage(card.color)}
                      className="expanded-card"
                      alt={t("gameOverlays.card")}
                    />
                  ))}
                  {expandedPlayerCards.collection.length === 0 && (
                    <div className="empty-expanded"></div>
                  )}
                </div>
              </div>
              <div className="expanded-section">
                <h4>
                  {t("gameOverlays.wild")} ({expandedPlayerCards.wild.length})
                </h4>
                <div className="expanded-cards-grid">
                  {expandedPlayerCards.wild.map((card, index) => (
                    <img
                      key={`wild-${index}`}
                      src={getCardImage(card.color)}
                      className="expanded-card"
                      alt={t("gameOverlays.wild")}
                    />
                  ))}
                  {expandedPlayerCards.wild.length === 0 && (
                    <div className="empty-expanded"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isCardZoomed && zoomCardType && (
        <section
          className="card-zoom-overlay"
          role="dialog"
          aria-modal="true"
          onClick={onCloseZoom}
        >
          <div
            className="card-zoom-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="card-zoom-close" onClick={onCloseZoom}>
              ×
            </button>
            <img
              src={getCardImage(zoomCardType)}
              alt={t("gameOverlays.zoomed")}
              className="card-zoomed-img"
            />
            <div className="card-zoom-title">
              {zoomCardType === "summary_brown"
                ? t("gameOverlays.summaryBrown")
                : t("gameOverlays.summaryViolet")}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
