import { GameActionsProps } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";

export const GameActions: React.FC<GameActionsProps> = ({
  isFinished,
  isOwner,
  isPrepared,
  isPaused,
  canStart,
  isTurn,
  selectedColumnIndex,
  isAnimating,
  isSelectedColumnFull,
  activeAction,
  onStartGame,
  onShowScores,
  onReveal,
  onTake,
  onLeave,
  reassignmentMessage,
  endRoundActive,
}) => {
  const controlsDisabled =
    !isTurn || selectedColumnIndex === null || isAnimating || isPaused;

  const t = useLanguageStore((state) => state.t);

  return (
    <section className="gamepage-actions" aria-label="Game actions">
      {isFinished ? (
        <button className="action-btn" onClick={onShowScores}>
          {t("gameActions.showScores")}
        </button>
      ) : isOwner && !isPrepared && canStart ? (
        <button className="action-btn start-game" onClick={onStartGame}>
          {t("gameActions.startGame")}
        </button>
      ) : !isPrepared ? (
        <></>
      ) : (
        <>
          <button
            data-testid="btn-reveal-card"
            className="action-btn"
            onClick={onReveal}
            disabled={controlsDisabled || isSelectedColumnFull}
          >
            {isSelectedColumnFull
              ? t("gameActions.full")
              : activeAction === "reveal"
                ? t("gameActions.revealingCard")
                : t("gameActions.revealCard")}
          </button>
          <button
            data-testid="btn-take-column"
            className="action-btn"
            onClick={onTake}
            disabled={controlsDisabled}
          >
            {activeAction === "take"
              ? t("gameActions.takingColumn")
              : t("gameActions.takeColumn")}
          </button>
        </>
      )}

      <button
        data-testid="btn-exit-game"
        className="action-btn leave"
        onClick={onLeave}
        disabled={
          !isFinished &&
          (isAnimating || !!reassignmentMessage || !!endRoundActive)
        }
      >
        {t("gameActions.leaveGame")}
      </button>
    </section>
  );
};
