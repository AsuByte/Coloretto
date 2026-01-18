import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGameStore } from "@/context/store/GameStore";
import { GameDetails } from "@/types/types";
import { useAuth } from "@/constants/data";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "@/pages/chats/Chat";

import * as GameHooks from "@/hooks/game";
import * as GameUI from "@/components/game";
import "@/css/games/gameComponents/index.css";

const GamePageAI: React.FC = () => {
  const {
    fetchGames,
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

  const [preparationCountdown, setPreparationCountdown] = useState<
    number | null
  >(null);
  const [isAutoPreparing, setIsAutoPreparing] = useState(false);
  const [isCardZoomed, setIsCardZoomed] = useState(false);

  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preparationStartedRef = useRef(false);
  const columnsContainerRef = useRef<HTMLDivElement>(null);
  const scoresContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const startAutoPreparation = useCallback(async () => {
    if (preparationStartedRef.current) return;

    preparationStartedRef.current = true;
    setIsAutoPreparing(true);

    let countdown = 5;
    setPreparationCountdown(countdown);

    const countdownInterval = setInterval(() => {
      countdown--;
      setPreparationCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        setPreparationCountdown(0);
      }
    }, 1000);

    setTimeout(async () => {
      clearInterval(countdownInterval);

      try {
        if (!gameDetails) return;

        setPreparationCountdown(null);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const result = await useGameStore
          .getState()
          .prepareGame(gameDetails.gameName);

        if (result) {
          if (socket) {
            socket.emit("gamePrepared", {
              gameName: gameDetails.gameName,
              game: result,
              preparedByAI: true,
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));

          setGameDetails(result);
        }
      } catch (error) {
        console.error("Preparation Error:", error);
      } finally {
        setIsAutoPreparing(false);
        setPreparationCountdown(null);
        preparationStartedRef.current = false;
      }
    }, 5000);
  }, [gameDetails, socket]);

  useEffect(() => {
    if (!gameDetails || !user || gameDetails.isPrepared) return;

    const shouldAutoPrepare =
      gameDetails.owner === user.username &&
      gameDetails.aiPlayers?.length > 0 &&
      !gameDetails.isPrepared &&
      !preparationStartedRef.current;

    if (shouldAutoPrepare) {
      startAutoPreparation();
    }
  }, [gameDetails, startAutoPreparation, user]);

  useEffect(() => {
    if (!gameDetails || !selectedGame || gameDetails.isFinished) {
      return;
    }

    if (isRoundEndAnimationBlocking || showEndRoundOverlay) {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
        aiTurnTimeoutRef.current = null;
      }
      return;
    }

    const allPlayers = [
      ...(gameDetails.players || []),
      ...(gameDetails.aiPlayers?.map((ai) => ai.name) || []),
    ];
    const currentPlayer = allPlayers[gameDetails.currentPlayerIndex];

    const isCurrentPlayerAI = gameDetails.aiPlayers?.some(
      (ai) => ai.name === currentPlayer
    );
    const hasTakenColumn =
      gameDetails.playersTakenColumn?.includes(currentPlayer) || false;

    if (!isCurrentPlayerAI || hasTakenColumn) {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
        aiTurnTimeoutRef.current = null;
      }
      return;
    }

    let delayTime = 2000;

    const isGameJustPrepared =
      gameDetails.isPrepared &&
      (!gameDetails.lastActivity ||
        Date.now() - new Date(gameDetails.lastActivity).getTime() < 10000);

    if (isGameJustPrepared) {
      delayTime = 4000;
    }

    if (aiTurnTimeoutRef.current) {
      clearTimeout(aiTurnTimeoutRef.current);
    }

    aiTurnTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await useGameStore
          .getState()
          .aiAction(selectedGame, currentPlayer);
        const aiActions = response.actions;

        for (let i = 0; i < aiActions.length; i++) {
          if (i < aiActions.length - 1) {
            const actionDelay = i === 0 ? 3000 : 2000;
            await new Promise((resolve) => setTimeout(resolve, actionDelay));
          }
        }

        setTimeout(async () => {
          const updated = await getGameDetails(selectedGame);
          if (updated) {
            setGameDetails(updated);
          }
        }, 2000);
      } catch (error) {
        console.error("Error IA:", error);
      } finally {
        aiTurnTimeoutRef.current = null;
      }
    }, delayTime);

    return () => {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
        aiTurnTimeoutRef.current = null;
      }
    };
  }, [
    gameDetails,
    selectedGame,
    isRoundEndAnimationBlocking,
    showEndRoundOverlay,
    getGameDetails,
  ]);

  useEffect(() => {
    if (!gameDetails || endRoundCardInSidebar || showEndRoundOverlay) return;

    const hasEndRoundCard = gameDetails.isRoundCardRevealed === true;

    const columnsHaveEndRound = gameDetails.columns.some((column) =>
      column.cards.some(
        (card) => card.isEndRound === true || card.color === "endRound"
      )
    );

    if (hasEndRoundCard || columnsHaveEndRound) {
      setTimeout(() => {
        handleEndRoundCard();
      }, 300);
    }
  }, [
    gameDetails,
    endRoundCardInSidebar,
    showEndRoundOverlay,
    handleEndRoundCard,
  ]);

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
    const limit = hasGoldenWild ? 5 : 4;

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
          isPaused={activeGame.isPaused ?? false}
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
            revealingCard={{ isAnimating: false }}
            columnsContainerRef={columnsContainerRef}
          />

          <GameUI.GameActions
            isFinished={activeGame.isFinished}
            isOwner={activeGame.owner === user?.username}
            isPrepared={true}
            isPaused={false}
            canStart={false}
            isTurn={isCurrentPlayerTurn()}
            selectedColumnIndex={selectedColumnIndex}
            isAnimating={
              isRoundEndAnimationBlocking ||
              showEndRoundOverlay ||
              isAnimationActive
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

export default GamePageAI;
