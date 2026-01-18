import React, { useRef } from "react";
import { useTutorial } from "@/pages/tutorial/logic";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { GameDetails } from "@/types/types";

import {
  GameHeader,
  GameSidebar,
  GameCenter,
  PlayerList,
  GameActions,
} from "@/components/game";

import "@/css/tutorial/TutorialLayout.css";
import "@/css/tutorial/TutorialGamePage.css";
import "@/css/tutorial/TutorialResponsive.css";
import "@/css/games/gameComponents/index.css";

const TutorialPageGame: React.FC = () => {
  const {
    tutorialData,
    selectedColumnIndex,
    isAutoPlaying,
    getPlayerCollection,
    getPlayerWildCards,
    getPlayerSummaryCards,
    getAllPlayers,
    handleColumnClick,
    handleSkip,
  } = useTutorial();

  const t = useLanguageStore((state) => state.t);

  const columnsRef = useRef<HTMLDivElement>(null);

  const gameDetailsMock = tutorialData as unknown as GameDetails;

  return (
    <div className="game-page tutorial-mode">
      <div className="tutorial-banner">
        <div className="tutorial-progress">
          <div className="progress-step active">
            <span className="step-number">1</span>
            <span className="step-label">{t("tutorialJSX.interface")}</span>
          </div>
          <div
            className={`progress-step ${
              selectedColumnIndex !== null || isAutoPlaying ? "active" : ""
            }`}
          >
            <span className="step-number">2</span>
            <span className="step-label">{t("tutorialJSX.mechanics")}</span>
          </div>
          <div className={`progress-step ${isAutoPlaying ? "active" : ""}`}>
            <span className="step-number">3</span>
            <span className="step-label">{t("tutorialJSX.scoring")}</span>
          </div>
        </div>
      </div>

      <div className="game-container">
        <GameHeader
          gameName={tutorialData.gameName}
          isFinished={tutorialData.isFinished}
          isPrepared={tutorialData.isPrepared}
          isPaused={false}
          isReassigning={false}
          reassignmentMessage=""
          endRoundActive={false}
          isTurn={true}
          turnPlayerName={t("tutorialJSX.you")}
          currentPlayers={3}
          maxPlayers={5}
        />

        <div className="game-main-area">
          <GameSidebar
            gameDetails={gameDetailsMock}
            endRoundCardInSidebar={false}
            getSummaryCardClass={() => "summary_brown"}
            getPlayerSummaryCards={getPlayerSummaryCards}
            totalPlayers={getAllPlayers().length}
          />

          <GameCenter
            gameDetails={gameDetailsMock}
            selectedColumnIndex={selectedColumnIndex}
            handleColumnClick={handleColumnClick}
            revealingCard={{ isAnimating: false }}
            columnsContainerRef={columnsRef}
          />

          <PlayerList
            players={getAllPlayers()}
            currentUser=""
            owner={t("tutorialJSX.you")}
            gameDetails={gameDetailsMock}
            getPlayerCollection={getPlayerCollection}
            getPlayerWildCards={getPlayerWildCards}
            onPlayerClick={() => {}}
          />
        </div>

        <GameActions
          isFinished={false}
          isOwner={true}
          isPrepared={true}
          isPaused={false}
          canStart={false}
          isTurn={!isAutoPlaying}
          isSelectedColumnFull={true}
          selectedColumnIndex={selectedColumnIndex}
          isAnimating={isAutoPlaying}
          onShowScores={() => {}}
          onReveal={() => {}}
          onTake={() => {}}
          onLeave={handleSkip}
          hasTakenColumn={false}
        />
      </div>
    </div>
  );
};

export default TutorialPageGame;
