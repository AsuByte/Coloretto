import axios from "axios";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";

import {
  getAvailableGames,
  getGameByName,
  joinGame,
  createAIGameOnly,
  createGame,
  getPreparationTimeRemaining,
  prepareGame,
  leaveGame,
  selectDifficultyAndPrepareGame,
  revealCard,
  takeColumn,
  aiTurn,
  finalizeScores,
  getReplaceableAIs,
  joinWithAIReplacement,
  replaceAI,
} from "@/api/auth";

import {
  Game,
  GameDetails,
  AITurnResponse,
  RevealCardResponse,
  TakeColumnResponse,
  FinalScoresResponse,
  ReplacementResult,
} from "@/types/types";

export interface GameState {
  games: Game[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string;
  currentGameName: string;
  currentUserGame: string;
  socket: Socket | null;
  isLeavingGame: boolean;
  replaceableAIs: string[];
  isRoundEndAnimation: boolean;

  initSocket: () => void;
  initializeStore: () => void;
  fetchGames: (page?: number) => Promise<void>;
  aiAction: (gameName: string, aiPlayerName: string) => Promise<AITurnResponse>;
  fetchUserGame: (owner: string) => Promise<Game | null>;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  joinGame: (gameName: string, username: string) => Promise<void>;
  createGame: (
    gameName: string,
    maxPlayers: number,
    ownerUsername: string,
    difficultyLevel: string
  ) => Promise<void>;
  createAIGameOnly: (
    gameName: string,
    owner: string,
    aiCount: number,
    difficulty: "Basic" | "Expert"
  ) => Promise<void>;
  getPreparationTimeRemaining: (gameName: string) => Promise<number | null>;
  selectDifficultyAndPrepareGame: (
    gameName: string,
    level: "Basic" | "Expert"
  ) => Promise<GameDetails | undefined>;
  prepareGame: (gameName: string) => Promise<GameDetails | undefined>;
  getReplaceableAIs: (gameName: string) => Promise<string[]>;
  joinWithAIReplacement: (
    gameName: string,
    username: string
  ) => Promise<ReplacementResult>;
  replaceAI: (
    gameName: string,
    originalAI: string,
    newPlayer: string
  ) => Promise<ReplacementResult>;
  setReplaceableAIs: (ais: string[]) => void;
  leaveGame: (gameName: string, username: string) => Promise<void>;
  revealCard: (
    gameName: string,
    playerName: string,
    columnIndex: number
  ) => Promise<RevealCardResponse>;
  takeColumn: (
    gameName: string,
    playerName: string,
    columnIndex: number
  ) => Promise<TakeColumnResponse>;
  endScores: (gameName: string) => Promise<FinalScoresResponse>;
  setError: (message: string) => void;
  setRoundEndAnimation: (isActive: boolean) => void;
  setCurrentGameName: (gameName: string) => void;
  setCurrentUserGame: (gameName: string) => void;
  setLoading: (isLoading: boolean) => void;
}

let aiActionLock = false;

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: "",
  currentGameName: "",
  currentUserGame: "",
  socket: null,
  isLeavingGame: false,
  replaceableAIs: [],
  isRoundEndAnimation: false,

  initSocket: () => {
    const { socket } = get();
    if (!socket) {
      const newSocket = io("http://192.168.1.18:3000", {
        withCredentials: true,
      });

      newSocket.on("connect", () => {});
      newSocket.on("disconnect", () => {});
      newSocket.on("gameUpdated", (data) => {
        const currentGame = get().currentGameName;
        if (currentGame && currentGame === data.gameName) {
          get().getGameDetails(currentGame);
        }
      });
      newSocket.on("gameCreated", () => get().fetchGames());
      newSocket.on("gameDeleted", () => get().fetchGames());
      newSocket.on("playerJoined", () => get().fetchGames());
      newSocket.on("ownerChanged", () => get().fetchGames());
      newSocket.on("playerLeft", () => get().fetchGames());
      newSocket.on("ai_replaced", () => get().fetchGames());
      newSocket.on("gameListUpdated", () => get().fetchGames());
      newSocket.on("gamePrepared", () => {});
      newSocket.on("preparationStarted", () => {});
      newSocket.on("cardsAssigned", () => {});

      newSocket.on("endRoundCardRevealed", () => {
        get().setRoundEndAnimation(true);
        setTimeout(() => {
          get().setRoundEndAnimation(false);
        }, 3000);
      });

      newSocket.on("ai_round_end_card", () => {
        get().setRoundEndAnimation(true);
        setTimeout(() => {
          get().setRoundEndAnimation(false);
        }, 3000);
      });

      newSocket.on("ai_card_revealed", (data) => {
        get().fetchGames();
        const currentGame = get().currentGameName;
        if (currentGame && currentGame === data.game?.gameName) {
          setTimeout(() => {
            get().getGameDetails(currentGame);
          }, 500);
        }
      });

      newSocket.on("cardRevealed", () => {});
      newSocket.on("gameFinalized", () => {});
      newSocket.connect();
      set({ socket: newSocket });
    }
  },

  initializeStore: () => {
    get().initSocket();
    get().fetchGames();
  },

  setRoundEndAnimation: (isActive: boolean) =>
    set({ isRoundEndAnimation: isActive }),

  fetchGames: async (page = 1) => {
    set({ isLoading: true, error: "" });
    try {
      const response = await getAvailableGames(page);
      const totalGames = response.data.pagination.totalGames;
      const gamesPerPage = 3;
      const totalPages = Math.max(1, Math.ceil(totalGames / gamesPerPage));

      set({
        games: response.data.games,
        totalPages,
        currentPage: page,
        error: "",
      });
    } catch (err: unknown) {
      console.error("Error fetching games:", err);
      set({ error: "Error fetching games" });
    }
  },

  fetchUserGame: async (username: string) => {
    try {
      await get().fetchGames();

      const userGame = get().games.find(
        (game) => game.players.includes(username) || game.owner === username
      );

      return userGame || null;
    } catch {
      return null;
    }
  },

  getGameDetails: async (gameName: string) => {
    try {
      const response = await getGameByName(gameName);
      const gameData = response.data as GameDetails;

      const cleanedColumns = (gameData.columns || []).map((column) => ({
        ...column,
        cards: (column.cards || []).filter(
          (card) => !(card.isEndRound === true || card.color === "endRound")
        ),
      }));

      return {
        ...gameData,
        players: gameData.players || [],
        aiPlayers: gameData.aiPlayers || [],
        columns: cleanedColumns,
        deck: gameData.deck || [],
        playerCollections: gameData.playerCollections || {},
        wildCards: gameData.wildCards || {},
        summaryCards: gameData.summaryCards || {},
        finalScores: gameData.finalScores || {},
        winner: gameData.winner || [],
      } as GameDetails;
    } catch (error: unknown) {
      console.error(`Error fetching game "${gameName}":`, error);

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }

      return false;
    }
  },

  joinGame: async (gameName: string, username: string) => {
    try {
      await joinGame(gameName, username);
      set({
        currentGameName: gameName,
        currentUserGame: gameName,
      });
      get().fetchGames();
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const errorWithResponse = err as { response?: { status?: number } };
        if (errorWithResponse.response?.status === 400) {
          set({ error: "Error join game" });
          return;
        }
      }
      set({ error: "Error join game" });
    }
  },

  getReplaceableAIs: async (gameName: string) => {
    try {
      const response = await getReplaceableAIs(gameName);
      const ais = response.data.ais;
      set({ replaceableAIs: ais });
      return ais;
    } catch (error) {
      console.error("Error fetching replaceable AIs:", error);
      set({ replaceableAIs: [] });
      return [];
    }
  },

  joinWithAIReplacement: async (gameName: string, username: string) => {
    try {
      const response = await joinWithAIReplacement(gameName, username);
      if (response.data.success) {
        await get().fetchGames();
      }
      return response.data;
    } catch (error) {
      console.error("Error joining with AI replacement:", error);
      throw error;
    }
  },

  replaceAI: async (
    gameName: string,
    originalAI: string,
    newPlayer: string
  ) => {
    try {
      const response = await replaceAI(gameName, originalAI, newPlayer);
      if (response.data.success) {
        await get().fetchGames();
      }
      return response.data;
    } catch (error) {
      console.error("Error replacing AI:", error);
      throw error;
    }
  },

  createGame: async (
    gameName: string,
    maxPlayers: number,
    ownerUsername: string,
    difficultyLevel: string
  ) => {
    try {
      const response = await createGame(
        gameName,
        maxPlayers,
        ownerUsername,
        difficultyLevel
      );

      if (response.data) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await get().fetchGames();
        set({
          currentGameName: gameName,
          currentUserGame: gameName,
        });
        return;
      }
      throw new Error("Failed to create game. Invalid response");
    } catch (err: unknown) {
      let errorMessage = "Failed to create game";

      if (axios.isAxiosError(err)) {
        console.error({
          status: err.response?.status,
          data: err.response?.data,
          message: err.response?.data?.message,
        });

        if (err.response?.status === 201) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await get().fetchGames();
          set({
            currentGameName: gameName,
            currentUserGame: gameName,
          });
          return;
        }

        errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          `Server error: ${err.response?.status}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  createAIGameOnly: async (
    gameName: string,
    owner: string,
    aiCount: number,
    difficulty: "Basic" | "Expert"
  ) => {
    try {
      const response = await createAIGameOnly(
        gameName,
        owner,
        aiCount,
        difficulty
      );
      if (response.data) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await get().fetchGames();
        set({
          currentGameName: gameName,
          currentUserGame: gameName,
        });
        return;
      }
      throw new Error("Failed to create AI game");
    } catch (err: unknown) {
      let errorMessage = "Failed to create AI game";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  getPreparationTimeRemaining: async (gameName: string) => {
    try {
      const response = await getPreparationTimeRemaining(gameName);
      return response.data.timeRemaining;
    } catch {
      return null;
    }
  },

  selectDifficultyAndPrepareGame: async (
    gameName: string,
    level: "Basic" | "Expert"
  ) => {
    try {
      const response = await selectDifficultyAndPrepareGame(gameName, level);
      if (response.data) {
        set({
          currentGameName: gameName,
          currentUserGame: gameName,
        });
        get().fetchGames();
        return response.data as GameDetails;
      } else {
        set({ error: "Failed to prepare game" });
        return undefined;
      }
    } catch (error) {
      set({ error: "Error selecting difficulty and preparing game" });
      console.error("Difficulty selection error:", error);
      return undefined;
    }
  },

  prepareGame: async (gameName: string) => {
    try {
      const gameDetails = await get().getGameDetails(gameName);

      if (!gameDetails) {
        set({ error: "Error prepare game" });
        throw new Error("Game not found");
      }

      if (gameDetails.players.length === 0) {
        set({ error: "Error prepare game" });
        throw new Error("No players in game");
      }

      if (gameDetails.aiPlayers && gameDetails.aiPlayers.length > 0) {
        const hasInvalidAi = !gameDetails.aiPlayers.every(
          (ai) => ai.difficulty && ["Basic", "Expert"].includes(ai.difficulty)
        );

        if (hasInvalidAi) {
          set({ error: "Error AI Configuration" });
          throw new Error("Invalid AI configuration");
        }
      }

      const response = await prepareGame(gameName);

      if (response.data) {
        set({
          currentGameName: gameName,
          currentUserGame: gameName,
        });
        await get().fetchGames();

        return response.data as GameDetails;
      } else {
        set({ error: "Error prepare game" });
        throw new Error("Failed to prepare game");
      }
    } catch (err: unknown) {
      console.error("Error preparing game:", err);
      let errorMessage = "Failed to prepare game";

      if (axios.isAxiosError(err)) {
        console.error(err.response?.data);
        errorMessage = err.response?.data?.message || errorMessage;
        if (err.response?.status === 400) {
          errorMessage =
            "Cannot prepare game: Invalid configuration or missing players";
        }
      }

      set({ error: errorMessage });
      throw err;
    }
  },

  leaveGame: async (gameName: string, username: string) => {
    if (get().isLeavingGame) {
      return;
    }

    set({ isLeavingGame: true });

    try {
      await leaveGame(gameName, username);

      set({ currentUserGame: "" });
    } catch (err: unknown) {
      console.error("Error:", err);
    } finally {
      set({ isLeavingGame: false });
    }
  },

  revealCard: async (
    gameName: string,
    playerName: string,
    columnIndex: number
  ) => {
    try {
      const response = await revealCard(gameName, playerName, columnIndex);
      const responseData = response.data as unknown as RevealCardResponse;

      return responseData;
    } catch (error: unknown) {
      console.error("Error revealing card:", error);

      let message = "Error revealing card";
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      set({ error: message });
      throw new Error(message);
    }
  },

  takeColumn: async (
    gameName: string,
    playerName: string,
    columnIndex: number
  ) => {
    try {
      const response = await takeColumn(gameName, playerName, columnIndex);
      const responseData = response.data as unknown as TakeColumnResponse;
      return responseData;
    } catch (error: unknown) {
      let message = "Error taking column";
      if (error instanceof Error) {
        message = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        message = apiError.response?.data?.message || message;
      }
      set({ error: message });
      throw new Error(message);
    }
  },

  aiAction: async (gameName: string, aiPlayerName: string) => {
    if (aiActionLock) {
      return { actions: [{ type: "blocked" }] } as AITurnResponse;
    }

    try {
      aiActionLock = true;

      const response = await aiTurn(gameName, aiPlayerName);
      const result = response.data;

      if (!Array.isArray(result.actions)) {
        result.actions = [result.actions || { type: "unknown" }];
      }

      return result;
    } catch (error) {
      console.error("AI turn error:", error);
      return { actions: [{ type: "error" }] } as AITurnResponse;
    } finally {
      setTimeout(() => {
        aiActionLock = false;
      }, 1000);
    }
  },

  endScores: async (gameName: string) => {
    try {
      const response = await finalizeScores(gameName);
      return response.data;
    } catch (error: unknown) {
      set({ error: "Error calculation error" });
      console.error("Score calculation error:", error);
      throw error;
    }
  },

  setError: (message: string) => set({ error: message }),
  setReplaceableAIs: (ais: string[]) => set({ replaceableAIs: ais }),
  setCurrentGameName: (gameName: string) => set({ currentGameName: gameName }),
  setCurrentUserGame: (gameName: string) => set({ currentUserGame: gameName }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
