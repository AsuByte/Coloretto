import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGameStore } from "@/context/store/GameStore";
import { GameDetails } from "@/types/types";
import { useAuth } from "@/constants/data";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "@/pages/chats/Chat";

import * as GameHooks from "@/hooks/game";
import * as GameUI from "@/components/game";
import "@/css/games/gameComponents/index.css";

const GamePagePlayers: React.FC = () => {
  const {
    fetchGames,
    prepareGame,
    getGameDetails,
    setCurrentGameName,
    setCurrentUserGame,
    socket,
  } = useGameStore();

  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameName } = useParams<{ gameName: string }>();
  const [selectedGame, setSelectedGame] = useState("");
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const handleSetGameDetails = useCallback((game: GameDetails) => {
    setGameDetails(game);
  }, []);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(
    null
  );
  const [, setShowScoreTable] = useState(false);
  const hasAutoShownScores = useRef(false);
  const { getPlayerCollection, getPlayerWildCards, getPlayerSummaryCards } =
    GameHooks.useGameHelpers(gameDetails);
  const {
    handleEndRoundCard,
    isRoundEndAnimationBlocking,
    showEndRoundOverlay,
    endRoundCardInSidebar,
  } = GameHooks.useEndRoundAnimation(
    selectedGame,
    getGameDetails,
    setGameDetails
  );
  const handleCardRevealed = GameHooks.useCardRevealed({
    gameName,
    getGameDetails,
    setGameDetails: handleSetGameDetails,
    handleEndRoundCard,
    ignoreAI: false,
  });
  const { preparationCountdown, isAutoPreparing, handlePreparationStarted } =
    GameHooks.useGamePreparation({
      gameName,
      user,
      getGameDetails,
      setGameDetails: handleSetGameDetails,
    });
  const { getSummaryCardClass, getAllPlayers, isCurrentPlayerTurn } =
    GameHooks.useGameStatus({
      gameDetails,
      user,
      selectedColumnIndex,
      setSelectedColumnIndex,
      getPlayerSummaryCards,
    });
  const { handleGameUpdated, handleGameFinalized } = GameHooks.useGameSync({
    gameName,
    selectedGame,
    getGameDetails,
    setGameDetails: handleSetGameDetails,
    setShowScoreTable,
    showEndRoundOverlay,
  });
  const {
    isReassigningColumns,
    reassignmentMessage,
    handleReassignmentStarting,
    handleReassignmentComplete,
  } = GameHooks.useGameReassignment({
    selectedGame,
    getGameDetails,
    setGameDetails: handleSetGameDetails,
  });
  const {
    showScoresOverlay,
    scoresData,
    handleShowScores,
    handleCloseScores,
    getConvertedWildCards,
  } = GameHooks.useGameScores({
    gameDetails,
    getGameDetails,
    setGameDetails: handleSetGameDetails,
    getPlayerCollection,
    getPlayerWildCards,
    getPlayerSummaryCards,
  });

  GameHooks.useGameSocketEvents({
    socket,
    gameName,
    user,
    fetchGames,
    getGameDetails,
    setGameDetails: handleSetGameDetails,
    setSelectedGame,
    setCurrentGameName,
    setCurrentUserGame,

    isReassigningColumns,
    showScoresOverlay,
    gameFinished: !!gameDetails?.isFinished,

    handleGameUpdated,
    handleGameFinalized,
    handleEndRoundCard,
    handleCardRevealed,
    handleReassignmentStarting,
    handleReassignmentComplete,
    handlePreparationStarted,
  });
  const {
    handleColumnClick,
    handleRevealCard,
    handleTakeColumn,
    handleLeaveGame,
    isAnimationActive,
    animationState,
  } = GameHooks.usePlayerActions({
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
  });
  const {
    expandedPlayer,
    setExpandedPlayer,
    expandedPlayerCards,
    setExpandedPlayerCards,
    handlePlayerClick,
  } = GameHooks.usePlayerSelection({
    selectedColumnIndex,
    setSelectedColumnIndex,
    getPlayerCollection,
    getPlayerWildCards,
  });

  const [isCardZoomed, setIsCardZoomed] = useState(false);
  const [revealingCard] = useState<{
    isAnimating: boolean;
    targetColumn?: number;
  }>({ isAnimating: false });

  const columnsContainerRef = useRef<HTMLDivElement>(null);
  const scoresContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const handleStartGame = async () => {
    if (!selectedGame || !user) return;

    try {
      await prepareGame(selectedGame);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!gameDetails) return;

    if (gameDetails.isFinished && !hasAutoShownScores.current) {
      handleShowScores();
      hasAutoShownScores.current = true;
    }

    if (!gameDetails.isFinished) {
      hasAutoShownScores.current = false;
    }
  }, [gameDetails, handleShowScores]);

  const activeGame = gameDetails;

  const isSelectedColumnFull = (() => {
    if (!activeGame || selectedColumnIndex === null) return false;

    const column = activeGame.columns[selectedColumnIndex];
    if (!column) return false;

    const hasGoldenWild = column.cards.some((c) => c.color === "golden_wild");
    const limit = hasGoldenWild ? 4 : 3;

    return column.cards.length >= limit;
  })();

  if (!activeGame) {
    return;
  }

  return (
    <div className="game-page">
      <GameUI.GameOverlays
        preparationCountdown={preparationCountdown}
        isAutoPreparing={isAutoPreparing}
        showEndRoundOverlay={showEndRoundOverlay}
        expandedPlayer={expandedPlayer}
        expandedPlayerCards={expandedPlayerCards}
        onCloseExpanded={() => {
          setExpandedPlayer(null);
          setExpandedPlayerCards({ collection: [], wild: [] });
        }}
        isCardZoomed={isCardZoomed}
        onCloseZoom={() => setIsCardZoomed(false)}
        zoomCardType={scoresData?.players[0]?.summaryType}
      />

      {showScoresOverlay && scoresData && (
        <GameUI.ScoresOverlay
          scoresData={scoresData}
          onClose={handleCloseScores}
          onZoom={() => setIsCardZoomed(true)}
          contentRef={scoresContentRef}
          getConvertedWildCards={getConvertedWildCards}
        />
      )}

      <div className="game-container">
        <GameUI.GameHeader
          gameName={activeGame.gameName}
          isFinished={activeGame.isFinished}
          isPrepared={activeGame.isPrepared}
          isPaused={activeGame.isPaused}
          isReassigning={isReassigningColumns}
          reassignmentMessage={reassignmentMessage}
          endRoundActive={
            (activeGame.playersTakenColumn?.length || 0) >=
            getAllPlayers().length
          }
          isTurn={isCurrentPlayerTurn()}
          turnPlayerName={getAllPlayers()[activeGame.currentPlayerIndex]}
          currentPlayers={activeGame.players.length}
          maxPlayers={activeGame.maxPlayers}
        />

        <div className="game-main-area">
          <GameUI.GameSidebar
            gameDetails={activeGame}
            endRoundCardInSidebar={endRoundCardInSidebar}
            getSummaryCardClass={getSummaryCardClass}
            getPlayerSummaryCards={getPlayerSummaryCards}
            totalPlayers={getAllPlayers().length}
          />

          <GameUI.GameCenter
            gameDetails={activeGame}
            selectedColumnIndex={selectedColumnIndex}
            handleColumnClick={handleColumnClick}
            revealingCard={revealingCard}
            columnsContainerRef={columnsContainerRef}
          />

          <GameUI.GameActions
            isFinished={activeGame.isFinished}
            isOwner={activeGame.owner === user?.username}
            isPrepared={activeGame.isPrepared}
            isPaused={activeGame.isPaused ?? false}
            canStart={activeGame.players.length >= activeGame.maxPlayers}
            onStartGame={handleStartGame}
            isTurn={isCurrentPlayerTurn()}
            selectedColumnIndex={selectedColumnIndex}
            isAnimating={
              isAnimationActive ||
              isRoundEndAnimationBlocking ||
              showEndRoundOverlay
            }
            isSelectedColumnFull={isSelectedColumnFull}
            activeAction={animationState}
            onShowScores={handleShowScores}
            onReveal={handleRevealCard}
            onTake={handleTakeColumn}
            onLeave={handleLeaveGame}
            reassignmentMessage={reassignmentMessage}
            endRoundActive={activeGame.isRoundCardRevealed}
            hasTakenColumn={false}
          />

          <GameUI.PlayerList
            players={getAllPlayers()}
            currentUser={user?.username}
            owner={activeGame.owner}
            gameDetails={activeGame}
            getPlayerCollection={getPlayerCollection}
            getPlayerWildCards={getPlayerWildCards}
            onPlayerClick={handlePlayerClick}
          />
          <div className="chat-section">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePagePlayers;
