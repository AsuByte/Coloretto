import React, { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "@/context/store/GameStore";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { Game } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/constants/data";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "@/css/games/GameList.css";

const GameList: React.FC = () => {
  const {
    games,
    fetchGames,
    currentPage,
    totalPages,
    error,
    socket,
    joinGame,
    initSocket,
    getReplaceableAIs,
  } = useGameStore();
  const t = useLanguageStore((state) => state.t);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGame] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [replaceableAIsByGame, setReplaceableAIsByGame] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const { initializeStore } = useGameStore.getState();
    initializeStore();
  }, [user, navigate]);

  useEffect(() => {
    const loadReplaceableAIs = async () => {
      const gamesWithAI = games.filter(
        (game) => game.aiPlayers && game.aiPlayers.length > 0
      );

      const newReplaceableAIs: Record<string, string[]> = {};

      for (const game of gamesWithAI) {
        try {
          const ais = await getReplaceableAIs(game.gameName);
          newReplaceableAIs[game.gameName] = ais;
        } catch (error) {
          console.error(
            `Error loading replaceable AIs for ${game.gameName}:`,
            error
          );
          newReplaceableAIs[game.gameName] = [];
        }
      }

      setReplaceableAIsByGame(newReplaceableAIs);
    };

    if (games.length > 0) {
      loadReplaceableAIs();
    }
  }, [games, getReplaceableAIs]);

  const stableFetchGames = useCallback(
    (page?: number) => {
      return fetchGames(page);
    },
    [fetchGames]
  );

  const stableInitSocket = useCallback(() => {
    return initSocket();
  }, [initSocket]);

  useEffect(() => {
    stableFetchGames();
    stableInitSocket();

    const handleRefresh = () => {
      stableFetchGames();
    };

    const handleGameUpdated = () => {
      stableFetchGames();
    };

    const handlePlayerJoinedGlobal = () => {
      stableFetchGames();
    };

    const handleOwnerChanged = () => {
      stableFetchGames();
    };

    const handleRoundEndCard = () => {
      stableFetchGames();
    };

    const handleAIRoundEndCard = () => {
      stableFetchGames();
    };

    const handleAIReplacedGlobal = () => {
      stableFetchGames();
    };

    const handlePlayerLeftGlobal = () => {
      stableFetchGames();
    };

    const handleGameDeleted = (deletedGameName: string) => {
      if (deletedGameName === selectedGame) {
        navigate("/play/join");
      }
      stableFetchGames();
    };

    const handleGameUnavailable = () => {
      stableFetchGames();
    };

    const sockets: Socket | null = socket;
    if (sockets) {
      sockets.on("gameCreated", handleRefresh);
      sockets.on("gameUpdated", handleGameUpdated);
      sockets.on("gameDeleted", handleGameDeleted);
      sockets.on("gameUnavailable", handleGameUnavailable);
      sockets.on("gameStateChanged", handleRefresh);
      sockets.on("gamePrepared", handleRefresh);
      sockets.on("preparationStarted", handleRefresh);
      sockets.on("playerJoined", handlePlayerJoinedGlobal);
      sockets.on("ownerChangedGlobal", handleOwnerChanged);
      sockets.on("ai_replaced", handleAIReplacedGlobal);
      sockets.on("playerLeft", handlePlayerLeftGlobal);
      sockets.on("round_end_card_revealed", handleRoundEndCard);
      sockets.on("ai_round_end_card", handleAIRoundEndCard);
    }

    return () => {
      if (sockets) {
        sockets.off("gameCreated", handleRefresh);
        sockets.off("gameUpdated", handleGameUpdated);
        sockets.off("gameDeleted", handleGameDeleted);
        sockets.off("gameUnavailable", handleGameUnavailable);
        sockets.off("gameStateChanged", handleRefresh);
        sockets.off("playerJoined", handlePlayerJoinedGlobal);
        sockets.off("ownerChangedGlobal", handleOwnerChanged);
        sockets.off("ai_replaced", handleAIReplacedGlobal);
        sockets.off("playerLeft", handlePlayerLeftGlobal);
        sockets.off("gamePrepared", handleRefresh);
        sockets.off("preparationStarted", handleRefresh);
        sockets.off("round_end_card_revealed", handleRoundEndCard);
        sockets.off("ai_round_end_card", handleAIRoundEndCard);
      }
    };
  }, [socket, navigate, selectedGame, stableFetchGames, stableInitSocket]);

  useEffect(() => {
    const checkGamesForDeletion = () => {
      games.forEach((game: Game) => {
        if (game.players.length === 0 && game.lastActivity) {
          const eliminationTime = 10 * 1000;
          const now = Date.now();
          const elapsed = now - new Date(game.lastActivity).getTime();
          const timeRemaining = Math.max(eliminationTime - elapsed, 0);
          if (timeRemaining <= 0) {
            stableFetchGames();
          }
        }
      });
    };

    checkGamesForDeletion();
    const intervalId = setInterval(checkGamesForDeletion, 100);

    return () => clearInterval(intervalId);
  }, [games, stableFetchGames]);

  const formatPreparationTime = (game: Game) => {
    const now = currentTime;

    if (game.isAvailable === false || game.players.length === 0) {
      const deletionMessage = formatEmptyGameMessage(game);
      return deletionMessage;
    }

    const totalPlayers = game.players.length + (game.aiPlayers?.length || 0);
    const maxPlayers = game.maxPlayers;
    const isAIGame = game.aiPlayers?.length > 0;

    const timeField = isAIGame
      ? game.preparationTimeIA || game.preparationTime
      : game.preparationTime;

    if (!timeField) {
      if (totalPlayers >= maxPlayers) {
        return t("gameList.waitingOwner");
      } else {
        return t("gameList.waitingPlayers");
      }
    }

    const preparationTime = new Date(timeField).getTime();
    const timeRemaining = preparationTime - now;

    if (timeRemaining <= 0) {
      const elapsed = Math.abs(timeRemaining);
      const elapsedSeconds = Math.floor(elapsed / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const elapsedHours = Math.floor(elapsedMinutes / 60);

      if (isAIGame && !game.isPrepared) {
        return "";
      }

      const messageOne = t("gameList.timeGameOne");

      if (elapsedHours > 0) {
        const minutes = elapsedMinutes % 60;
        const seconds = elapsedSeconds % 60;
        return `${messageOne} ${elapsedHours}h ${minutes}m ${seconds}s.`;
      } else if (elapsedMinutes > 0) {
        const seconds = elapsedSeconds % 60;
        return `${messageOne} ${elapsedMinutes}m ${seconds}s.`;
      } else {
        return `${messageOne} ${elapsedSeconds}s.`;
      }
    }

    const seconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const messageThree = t("gameList.timeGameThree");
    const messageFour = t("gameList.timeGameFour");

    if (hours > 0) {
      const minutesLeft = minutes % 60;
      const secondsLeft = seconds % 60;
      return `${messageThree} ${hours}h ${minutesLeft}m ${secondsLeft}s`;
    } else if (minutes > 0) {
      const secondsLeft = seconds % 60;
      return `${messageThree} ${minutes}m ${secondsLeft}s`;
    } else {
      return isAIGame
        ? `${messageFour} ${seconds}s`
        : `${messageThree} ${seconds}s`;
    }
  };

  const formatEmptyGameMessage = (game: Game) => {
    const message = t("gameList.delete");
    const messageTwo = t("gameList.deleting");
    if (game.players.length === 0) {
      const lastActivity = game.lastActivity;
      if (!lastActivity) return message;

      const startTime = new Date(lastActivity).getTime();
      const elapsed = currentTime - startTime;
      const timeRemaining = 10000 - elapsed;

      if (timeRemaining <= 0 || currentTime === 0) return message;

      const seconds = Math.min(Math.ceil(timeRemaining / 1000), 10);
      return `${messageTwo} ${seconds}s...`;
    }
    return null;
  };

  const handleJoinGame = async (gameName: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const game = games.find((g: Game) => g.gameName === gameName);

    if (!game) {
      return;
    }

    if (game.players.includes(user.username)) {
      const hasAI = game.aiPlayers && game.aiPlayers.length > 0;
      navigate(hasAI ? `/play/ai/${gameName}` : `/play/players/${gameName}`);
      return;
    }

    const totalPlayers = game.players.length + (game.aiPlayers?.length || 0);
    if (game.playersTakenColumn?.length === totalPlayers && totalPlayers > 0) {
      const message = t("gameList.columns");
      toast.error(message);
      return;
    }

    if (game.isRoundCardRevealed) {
      const message = t("gameList.endRound");
      toast.error(message);
      return;
    }

    try {
      const canJoin = canJoinGame(game);

      if (canJoin) {
        await joinGame(gameName, user.username);
        const hasAI = game.aiPlayers && game.aiPlayers.length > 0;
        navigate(hasAI ? `/play/ai/${gameName}` : `/play/players/${gameName}`);
      }
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 404) {
          return;
        }
      }
    }
  };

  const isLastPage = () => currentPage >= totalPages;

  const userIsInAnotherGame = (currentGameName: string) => {
    return games.some(
      (game: Game) =>
        game.gameName !== currentGameName &&
        game.players.includes(user?.username || "")
    );
  };

  const isInCurrentGame = (gameName: string) => {
    const currentGame = games.find((g: Game) => g.gameName === gameName);

    if (currentGame) {
      return (
        currentGame.players.includes(user?.username || "") ||
        currentGame.owner === user?.username
      );
    }

    return false;
  };

  const canJoinGame = (game: Game): boolean => {
    if (game.isAvailable === false) {
      return false;
    }

    if (isInCurrentGame(game.gameName)) {
      return true;
    }

    const totalPlayers = game.players.length + (game.aiPlayers?.length || 0);
    if (game.playersTakenColumn?.length === totalPlayers && totalPlayers > 0) {
      return false;
    }

    if (userIsInAnotherGame(game.gameName) && !isInCurrentGame(game.gameName)) {
      return false;
    }

    if (userIsInAnotherGame(game.gameName)) {
      return false;
    }

    if (game.isFinished) {
      return false;
    }

    if (game.isRoundCardRevealed) {
      return false;
    }

    const hasEmptySlotForHuman = game.players.length < game.maxPlayers;

    const hasReplaceableAIs = replaceableAIsByGame[game.gameName]?.length > 0;

    const totalActivePlayers =
      game.players.length + (game.aiPlayers?.length || 0);
    const isNotAtMaxCapacity = totalActivePlayers < game.maxPlayers;

    return hasEmptySlotForHuman || hasReplaceableAIs || isNotAtMaxCapacity;
  };

  return (
    <section className="game-list-container">
      <h1 className="item glow">{t("gameList.titleJSX")}</h1>
      {error ? (
        <div className="error">{String(error)}</div>
      ) : (
        <>
          <div className="games-section">
            {games && games.length === 0 ? (
              <p className="no-games-message">{t("gameList.noGamesJSX")}</p>
            ) : (
              <ul className="games-list">
                {games
                  .slice()
                  .sort((gameA: Game, gameB: Game) => {
                    const isUserAOwner = gameA.owner === user?.username;
                    const isUserBOwner = gameB.owner === user?.username;

                    if (isUserAOwner && !isUserBOwner) return -1;
                    if (!isUserAOwner && isUserBOwner) return 1;

                    return gameA.gameName.localeCompare(gameB.gameName);
                  })
                  .map((game: Game) => {
                    const canJoin = canJoinGame(game);
                    const totalPlayers =
                      game.players.length + (game.aiPlayers?.length || 0);
                    const isReassigning =
                      game.playersTakenColumn?.length === totalPlayers &&
                      totalPlayers > 0;

                    return (
                      <li key={game._id} className="game-card">
                        <article className="game-info">
                          <span className="game-name">{game.gameName}</span>
                          <span className="game-owner">
                            {t("gameList.ownerJSX")}: {game.owner}
                          </span>

                          <div className="players-line">
                            <span className="players-count">
                              {game.players.length}{" "}
                              {t("gameList.playersOneJSX")} {game.maxPlayers}{" "}
                              {t("gameList.playersTwoJSX")}
                            </span>
                            {game.aiPlayers?.length > 0 && (
                              <span className="ai-count">
                                ({game.aiPlayers.length} {t("gameList.AI")}
                                {game.aiPlayers.length > 1 ? "s" : ""})
                              </span>
                            )}
                          </div>

                          {game.players.length === 0 ? (
                            <span className="deleting-countdown">
                              {formatEmptyGameMessage(game)}
                            </span>
                          ) : game.isFinished ? (
                            <span className="finished">
                              {t("gameList.finishedJSX")}
                            </span>
                          ) : game.isRoundCardRevealed ? (
                            <span className="endRound">
                              {t("gameList.endRoundJSX")}
                            </span>
                          ) : (
                            <span className="time">
                              {formatPreparationTime(game)}
                            </span>
                          )}
                        </article>

                        <div className="game-actions">
                          <button
                            className="join-game-button"
                            onClick={() => handleJoinGame(game.gameName)}
                            disabled={
                              game.isAvailable === false ||
                              game.isRoundCardRevealed ||
                              isReassigning ||
                              !canJoin ||
                              game.isFinished
                            }
                            title={
                              game.isAvailable === false
                                ? t("gameList.noAvailable")
                                : game.isRoundCardRevealed
                                ? t("gameList.endRound")
                                : isReassigning
                                ? t("gameList.columns")
                                : !canJoin
                                ? t("gameList.full")
                                : t("gameList.join")
                            }
                          >
                            {game.isAvailable === false
                              ? t("gameList.unavailable")
                              : game.isFinished
                              ? t("gameList.finish")
                              : isInCurrentGame(game.gameName)
                              ? t("gameList.enter")
                              : userIsInAnotherGame(game.gameName)
                              ? t("gameList.already")
                              : game.isRoundCardRevealed
                              ? t("gameList.joinJSX")
                              : isReassigning
                              ? t("gameList.reassigning")
                              : canJoin
                              ? t("gameList.join")
                              : t("gameList.fullJSX")}
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          <nav className="game-content">
            <div className="game-item">
              <button
                className="arrow-button"
                disabled={currentPage <= 1}
                onClick={() => fetchGames(currentPage - 1)}
              >
                <FaArrowLeft className="left-arrow" />
              </button>
              <span className="page">
                {t("gameList.page")} {currentPage}
              </span>
              <button
                className="arrow-button"
                disabled={isLastPage()}
                onClick={() => fetchGames(currentPage + 1)}
              >
                <FaArrowRight className="right-arrow" />
              </button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
};

export default GameList;
