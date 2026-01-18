import axios from "@/api/axios";
import {
  User,
  AuthResponse,
  Message,
  Game,
  GameDetails,
  AITurnResponse,
  RoundEndResponse,
  FinalScoresResponse,
  PaginatedGamesResponse,
  PreparationTimeResponse,
  ShouldEndRoundResponse,
  ReplacementResult,
  ReplaceableAIsResponse,
} from "@/types/types";

export const getAllUsernames = (): Promise<{ data: string[] }> =>
  axios.get("/users/usernames");

export const profileUser = (username: string): Promise<{ data: User }> =>
  axios.get(`/users/profile/${username}`);

export const getConnectionTime = (
  username: string
): Promise<{ data: { connectionTime: string } }> =>
  axios.get(`/auth/${username}/connection-time`);

export const registerRequest = (user: User): Promise<{ data: AuthResponse }> =>
  axios.post("/users/register", user);

export const loginRequest = (user: User): Promise<{ data: AuthResponse }> =>
  axios.post("/auth/login", user);

export const verifyToken = (): Promise<{
  data: {
    username: { valid: boolean; user?: User };
    valid: boolean;
    user?: User;
  };
}> => axios.post("/auth/verify-token");

export const removeToken = (): Promise<{ data: { message: string } }> =>
  axios.post("/auth/logout");

export const updateProfilePicture = (
  username: string,
  formData: FormData
): Promise<{ data: { message: string; profilePicture: string } }> =>
  axios.put(`/users/profile/${username}/update-profile-picture`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateEmail = (
  username: string,
  password: string,
  newEmail: string
): Promise<{ data: { message: string } }> =>
  axios.put(`/users/profile/${username}/change-email`, { password, newEmail });

export const updatePassword = (
  username: string,
  currentPassword: string,
  newPassword: string,
  verifyPassword: string
): Promise<{ data: { message: string } }> =>
  axios.put(`/users/profile/${username}/change-password`, {
    currentPassword,
    newPassword,
    verifyPassword,
  });

export const removeAccount = (
  username: string
): Promise<{ data: { message: string } }> => axios.delete(`/users/${username}`);

export const getAllMessages = (): Promise<{ data: Message[] }> =>
  axios.get("/messages/general");

export const getAllMessagesGame = (
  gameName: string
): Promise<{ data: Message[] }> =>
  axios.get(`/messages/game?gameName=${encodeURIComponent(gameName)}`);

export const getAvailableGames = (
  page: number = 1,
  pageSize: number = 3
): Promise<{ data: PaginatedGamesResponse }> =>
  axios.get(`/games?page=${page}&pageSize=${pageSize}`);

export const getPreparationTimeRemaining = (
  gameName: string
): Promise<{ data: PreparationTimeResponse }> =>
  axios.get(`/games/${encodeURIComponent(gameName)}/preparation-time`);

export const getGameByName = (
  gameName: string
): Promise<{ data: GameDetails }> =>
  axios.get(`/games/${encodeURIComponent(gameName)}`);

export const getGameByUser = (owner: string): Promise<{ data: GameDetails }> =>
  axios.get(`/games/owner/${encodeURIComponent(owner)}`);

export const createGame = async (
  gameName: string,
  maxPlayers: number,
  ownerUsername: string,
  difficultyLevel: string = "Basic"
): Promise<{ data: GameDetails }> => {
  return axios.post("/games/create", {
    gameName,
    maxPlayers,
    owner: ownerUsername,
    difficultyLevel,
  });
};

export const createAIGameOnly = (
  gameName: string,
  owner: string,
  aiCount: number,
  difficulty: "Basic" | "Expert" = "Basic"
): Promise<{ data: GameDetails }> => {
  return axios.post("/games/ai/create-only", {
    gameName,
    owner,
    aiCount,
    difficulty,
  });
};

export const aiTurn = (
  gameName: string,
  aiPlayerName: string
): Promise<{ data: AITurnResponse }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/ai-turn`, {
    aiPlayerName,
  });
};

export const selectDifficultyAndPrepareGame = (
  gameName: string,
  level: "Basic" | "Expert"
): Promise<{ data: Game }> =>
  axios.post(`/games/${encodeURIComponent(gameName)}/select-difficulty`, {
    level,
  });

export const joinGame = (
  gameName: string,
  username: string
): Promise<{ data: GameDetails }> =>
  axios.post("/games/join", { gameName, username });

export const joinWithAIReplacement = (
  gameName: string,
  username: string
): Promise<{ data: ReplacementResult }> => {
  return axios.post(
    `/games/${encodeURIComponent(gameName)}/join-with-replacement`,
    {
      username,
    }
  );
};

export const replaceAI = (
  gameName: string,
  originalAI: string,
  newPlayer: string
): Promise<{ data: ReplacementResult }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/replace-ai`, {
    originalAI,
    newPlayer,
  });
};

export const getReplaceableAIs = (
  gameName: string
): Promise<{ data: ReplaceableAIsResponse }> => {
  return axios.get(`/games/${encodeURIComponent(gameName)}/replaceable-ais`);
};

export const prepareGame = (
  gameName: string
): Promise<{ data: GameDetails }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/prepare`);
};

export const revealCard = (
  gameName: string,
  playerName: string,
  columnIndex: number
): Promise<{ data: GameDetails }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/reveal-card`, {
    playerName,
    columnIndex,
  });
};

export const takeColumn = (
  gameName: string,
  playerName: string,
  columnIndex: number
): Promise<{ data: GameDetails }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/take-column`, {
    playerName,
    columnIndex,
  });
};

export const shouldEndRound = (
  gameName: string
): Promise<{ data: ShouldEndRoundResponse }> => {
  return axios.get(`/games/${encodeURIComponent(gameName)}/should-end-round`);
};

export const endRound = (
  gameName: string
): Promise<{ data: RoundEndResponse }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/end-round`);
};

export const finalizeScores = (
  gameName: string
): Promise<{ data: FinalScoresResponse }> => {
  return axios.post(`/games/${encodeURIComponent(gameName)}/finalize-scores`);
};

export const leaveGame = (
  gameName: string,
  username: string
): Promise<{ data: { message: string } }> => {
  return axios.delete(
    `/games/${encodeURIComponent(gameName)}/leave/${encodeURIComponent(
      username
    )}`
  );
};
