import { useLanguageStore } from "@/context/store/LanguageStore";
import { GameHeaderProps } from "@/types/types";

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameName,
  isFinished,
  isPrepared,
  isPaused,
  isReassigning,
  reassignmentMessage,
  endRoundActive,
  isTurn,
  turnPlayerName,
  currentPlayers,
  maxPlayers,
}) => {
  const t = useLanguageStore((state) => state.t);

  const getStatusContent = () => {
    if (isFinished) {
      return (
        <span className="finished-simple">{t("gameHeader.finished")}</span>
      );
    }

    const current = Number(currentPlayers);
    const max = Number(maxPlayers);
    const hasVacancy = current < max;

    if (hasVacancy && (!isPrepared || isPaused)) {
      return (
        <span className="waiting-turn">
          {t("gameHeader.waitingPlayers")} ({current}/{max})
        </span>
      );
    }

    if (!isPrepared && !hasVacancy) {
      return <span className="other-turn">{t("gameList.waitingOwner")}</span>;
    }

    if (isPaused) {
      return <span className="other-turn">{t("gameList.waitingOwner")}</span>;
    }

    if (isReassigning) {
      return (
        <span className="other-turn reassigning">{reassignmentMessage}</span>
      );
    }

    if (endRoundActive) {
      return <span className="other-turn">{t("gameHeader.endRound")}</span>;
    }

    if (isTurn) {
      return <span className="your-turn">{t("gameHeader.turn")}</span>;
    }

    return (
      <span className="other-turn">
        {t("gameHeader.turnOf")} {turnPlayerName}
      </span>
    );
  };

  return (
    <header className="game-header">
      <div className="game-title">
        <h2 data-testid="header-game-title">{gameName}</h2>
      </div>
      <div data-testid="header-turn-info" className="turn-info">{getStatusContent()}</div>
    </header>
  );
};
