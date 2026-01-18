import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { toast } from "react-hot-toast";
import { GameDetails, UseGameSocketEventsProps } from "@/types/types";
import { isGameDetails } from "@/hooks/game/useHelpers";

export const useGameSocketEvents = ({
  socket,
  gameName,
  user,
  fetchGames,
  getGameDetails,
  setGameDetails,
  setSelectedGame,
  setCurrentGameName,
  setCurrentUserGame,
  isReassigningColumns,
  showScoresOverlay,
  gameFinished,
  handleGameUpdated,
  handleGameFinalized,
  handleEndRoundCard,
  handleCardRevealed,
  handleReassignmentStarting,
  handleReassignmentComplete,
  handlePreparationStarted,
}: UseGameSocketEventsProps) => {
  const t = useLanguageStore((state) => state.t);
  const navigate = useNavigate();
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const latestState = useRef({
    gameName,
    user,
    isReassigningColumns,
    showScoresOverlay,
    gameFinished,
    handleGameUpdated,
    handleGameFinalized,
    handleEndRoundCard,
    handleCardRevealed,
    handleReassignmentStarting,
    handleReassignmentComplete,
    handlePreparationStarted,
    getGameDetails,
    setGameDetails,
    fetchGames,
    setSelectedGame,
    setCurrentGameName,
    setCurrentUserGame,
  });

  useEffect(() => {
    latestState.current = {
      gameName,
      user,
      isReassigningColumns,
      showScoresOverlay,
      gameFinished,
      handleGameUpdated,
      handleGameFinalized,
      handleEndRoundCard,
      handleCardRevealed,
      handleReassignmentStarting,
      handleReassignmentComplete,
      handlePreparationStarted,
      getGameDetails,
      setGameDetails,
      fetchGames,
      setSelectedGame,
      setCurrentGameName,
      setCurrentUserGame,
    };
  }, [
    gameName,
    user,
    isReassigningColumns,
    showScoresOverlay,
    gameFinished,
    handleGameUpdated,
    handleGameFinalized,
    handleEndRoundCard,
    handleCardRevealed,
    handleReassignmentStarting,
    handleReassignmentComplete,
    handlePreparationStarted,
    getGameDetails,
    setGameDetails,
    fetchGames,
    setSelectedGame,
    setCurrentGameName,
    setCurrentUserGame,
  ]);

  useEffect(() => {
    let isMounted = true;

    const joinGameRoom = () => {
      if (socket && socket.connected && gameName && user) {
        socket.emit("joinGame", { gameName, username: user.username });
      }
    };

    if (socket?.connected) {
      joinGameRoom();
    }

    if (socket) {
      socket.on("connect", joinGameRoom);
    }

    const fetchData = async () => {
      if (!gameName || !user || !isMounted) return;

      try {
        await latestState.current.fetchGames();
        const gameData = await latestState.current.getGameDetails(gameName);
        if (
          (!gameData || !isGameDetails(gameData)) &&
          retryCountRef.current < maxRetries
        ) {
          retryCountRef.current += 1;
          setTimeout(() => {
            if (isMounted) fetchData();
          }, 1000);
          return;
        }

        if (isMounted && gameData && isGameDetails(gameData)) {
          retryCountRef.current = 0;
          latestState.current.setSelectedGame(gameName);
          latestState.current.setGameDetails(gameData);
          latestState.current.setCurrentGameName(gameName);
          latestState.current.setCurrentUserGame(gameName);
        } else if (isMounted) {
          console.error("Game not found after retries");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching game data:", error);
        }
      }
    };

    fetchData();

    const isForThisGame = (data: {
      gameName?: string;
      game?: { gameName?: string };
    }) => {
      const current = latestState.current.gameName;
      if (data?.gameName && data.gameName !== current) return false;
      if (data?.game?.gameName && data.game.gameName !== current) return false;
      return true;
    };

    const handlePlayerJoined = (data: {
      playerName: string;
      game?: GameDetails;
      replacedAI?: string;
      gameName?: string;
    }) => {
      if (!isMounted || !gameName) return;
      if (!isForThisGame(data)) return;

      const subMessageOne = t("hookSockets.subMessageOne");
      const subMessageTwo = t("hookSockets.subMessageTwo");
      const message = data.replacedAI
        ? `${data.playerName} ${subMessageOne} ${data.replacedAI}`
        : `${data.playerName} ${subMessageTwo}`;
      toast(message);

      if (data.game) {
        latestState.current.setGameDetails(data.game);
      }
    };

    const handlePlayerLeftGame = async (data: {
      username: string;
      game?: GameDetails;
      gameName?: string;
    }) => {
      if (!isMounted || !gameName) return;
      if (!isForThisGame(data)) return;

      const eventGameName = data.game?.gameName || data.gameName;
      const currentUser = latestState.current.user;

      if (data.username === currentUser?.username) {
        if (eventGameName === gameName || !eventGameName) {
          navigate("/play/join");
          return;
        }
      }

      if (
        latestState.current.showScoresOverlay ||
        latestState.current.gameFinished
      )
        return;

      if (data.game) {
        latestState.current.setGameDetails(data.game);
      } else {
        const updatedGame = await latestState.current.getGameDetails(gameName);
        if (updatedGame && isGameDetails(updatedGame))
          latestState.current.setGameDetails(updatedGame);
      }
    };

    const handleGameStateChanged = async (data: {
      game?: GameDetails;
      gameName?: string;
    }) => {
      if (!isMounted || !gameName) return;
      if (!isForThisGame(data)) return;
      if (latestState.current.isReassigningColumns) return;
      if (latestState.current.showScoresOverlay) return;

      if (data.game) {
        latestState.current.setGameDetails(data.game);
      } else {
        const updatedGame = await latestState.current.getGameDetails(gameName);
        if (updatedGame && isGameDetails(updatedGame)) {
          latestState.current.setGameDetails(updatedGame);
        } else {
          latestState.current.handleGameUpdated();
        }
      }
    };

    const handleOwnerChanged = (data: {
      game: GameDetails;
      oldOwner: string;
      newOwner: string;
      wasOwner?: boolean;
      gameName?: string;
    }) => {
      if (!isForThisGame(data)) return;

      latestState.current.setGameDetails(data.game);

      if (data.oldOwner === latestState.current.user?.username) {
        const message = t("hookSockets.newOwner");
        toast(`${message} ${data.newOwner}`);
      } else if (data.newOwner === latestState.current.user?.username) {
        const message = t("hookSockets.youOwner");
        toast.success(message);
      }
    };

    const handleAIReplaced = async (data: {
      originalAI: string;
      newPlayer: string;
      game?: GameDetails;
      timestamp: Date;
    }) => {
      if (!isMounted || !gameName) return;
      toast(`${data.newPlayer} replaced ${data.originalAI}`);

      if (data.game && data.game.gameName === gameName) {
        setGameDetails(data.game);
      } else {
        const updatedGame = await getGameDetails(gameName);
        if (updatedGame) {
          setGameDetails(updatedGame);
        }
      }
    };

    const socketHandlers = {
      playerJoined: (data: {
        username: string;
        game?: GameDetails;
        replacedAI?: string;
        gameName?: string;
      }) => {
        if (!isMounted || !gameName) return;
        if (!isForThisGame(data)) return;

        const subMessageOne = t("hookSockets.subMessageOne");
        const subMessageTwo = t("hookSockets.subMessageTwo");

        const message = data.replacedAI
          ? `${data.username} ${subMessageOne} ${data.replacedAI}`
          : `${data.username} ${subMessageTwo}`;

        toast.success(message);

        if (data.game) {
          latestState.current.setGameDetails(data.game);
        }
      },
      playerLeft: (data: {
        username: string;
        game?: GameDetails;
        gameName?: string;
      }) => {
        if (isForThisGame(data)) {
          toast.error(`${data.username} ${t("hookPlayerActions.leftGame")}`);
          handlePlayerLeftGame(data);
        }
      },

      gameFinalized: (data: { gameName?: string }) => {
        if (isForThisGame(data)) latestState.current.handleGameFinalized();
      },

      gameUpdated: handleGameStateChanged,
      columnTaken: (data: {
        playerName: string;
        columnIndex: number;
        game?: GameDetails;
        gameName?: string;
      }) => {
        if (isForThisGame(data)) {
          const colNum = (data.columnIndex || 0) + 1;
          const displayName = data.playerName || t("gameList.AI");
          toast.success(
            `${displayName} ${t("hookPlayerActions.column")} ${colNum}`
          );
          handleGameStateChanged(data);
        }
      },
      nextTurn: handleGameStateChanged,

      endRoundCardRevealed: (data: { gameName?: string }) => {
        if (isForThisGame(data)) latestState.current.handleEndRoundCard();
      },

      cardRevealed: (data: { gameName?: string }) => {
        if (isForThisGame(data)) latestState.current.handleCardRevealed(data);
      },

      gameStateChanged: handleGameStateChanged,
      gamePrepared: handleGameStateChanged,
      ai_replaced: handleAIReplaced,
      player_joined: handlePlayerJoined,
      ownerChanged: (data: {
        game: GameDetails;
        oldOwner: string;
        newOwner: string;
        gameName?: string;
      }) => {
        if (!isForThisGame(data)) return;

        latestState.current.setGameDetails(data.game);

        const msg = t("hookSockets.newOwner");
        toast.success(`${msg} ${data.newOwner}`);
        handleOwnerChanged(data);
      },
      game_state_changed: handleGameStateChanged,
      cardsAssigned: handleGameStateChanged,

      reassignmentStarting: (data: {
        gameName: string;
        message: string;
        duration: number;
        round: number;
      }) => {
        if (isForThisGame(data))
          latestState.current.handleReassignmentStarting(data);
      },

      reassignmentComplete: (data: {
        gameName: string;
        game: GameDetails;
        round: number;
      }) => {
        if (isForThisGame(data))
          latestState.current.handleReassignmentComplete(data);
      },

      ai_card_revealed: (data: { game?: GameDetails; gameName?: string }) => {
        if (!isForThisGame(data)) return;
        if (data.game) latestState.current.setGameDetails(data.game);
      },

      ai_round_end_card: (data: { gameName?: string }) => {
        if (isForThisGame(data)) latestState.current.handleEndRoundCard();
      },

      preparationStarted: (data: {
        difficulty: "Basic" | "Expert";
        gameName: string;
        preparationTime: number;
      }) => {
        if (!isForThisGame(data)) return;
        if (latestState.current.handlePreparationStarted) {
          latestState.current.handlePreparationStarted(data);
        }
      },
    };

    if (socket && isMounted) {
      Object.entries(socketHandlers).forEach(([event, handler]) => {
        socket.on(event, handler as (data: unknown) => void);
      });
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.off("connect", joinGameRoom);

        Object.entries(socketHandlers).forEach(([event, handler]) => {
          socket.off(event, handler as (data: unknown) => void);
        });
      }
    };
  }, [socket, gameName, user, navigate, t, setGameDetails, getGameDetails]);
};
