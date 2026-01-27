import { ReactNode } from "react";
import { Socket } from "socket.io-client";

export interface LanguageState {
  language: "en" | "es";
  setLanguage: (lang: "en" | "es") => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export interface UserProfile {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  password?: string;
  profilePicture?: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  lastSeen?: Date;
  isOnline?: boolean;
  connectionStartTime?: Date;
}

export interface User {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  password?: string;
  profilePicture?: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  lastSeen?: Date;
  isOnline?: boolean;
  connectionStartTime?: Date;
}

export interface AuthUser {
  _id?: string;
  username: string;
  email: string;
  profile?: UserProfile;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthResponseError {
  response?: { data?: { message: string } };
}

export interface LoginFormData {
  username: string;
  password: string;
  email: string;
  _id: string;
  fullname: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
}

export interface RegisterFormData {
  fullname: string;
  username: string;
  email: string;
  password: string;
  _id: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  verifyPassword: string;
}

export interface PasswordValidation {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  passwordsMatch: boolean;
}

export interface AuthContextType {
  handleUpdateProfilePicture: (username: string, file: File) => Promise<void>;
}

export interface ProfilePictureFormWindowParams
  extends Record<string, string | undefined> {
  username: string;
}

export interface PasswordFormPageParams
  extends Record<string, string | undefined> {
  username: string;
}

export interface Card {
  color: string;
  isEndRound?: boolean;
}

export interface Column {
  cards: Card[];
}

export interface Message {
  messageId: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  sender: string;
  gameName?: string;
  reactions?: { [emoji: string]: string[] };
  timestamp: number;
  formattedText?: string | React.ReactNode;
}

export interface AIPlayer {
  name: string;
  difficulty: "Basic" | "Expert";
  strategy: "conservative" | "balanced" | "aggressive";
  hasTakenColumn: boolean;
  cardsTakenThisRound: number;
  isAI: boolean;
}

export interface Game {
  _id: string;
  gameName: string;
  owner: string;
  players: string[];
  aiPlayers: AIPlayer[];
  maxPlayers: number;
  difficultyLevel: "Basic" | "Expert";
  isFinished: boolean;
  isPrepared: boolean;
  isAvailable?: boolean;
  preparationTime?: string;
  preparationTimeIA?: string;
  isPaused?: boolean;
  lastActivity?: string;
  isRoundCardRevealed?: boolean;
  playersTakenColumn: string[];
  winner: string[];
  finalScores: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameDetails extends Game {
  currentPlayerIndex: number;
  currentRound: number;
  deck: Card[];
  columns: Column[];
  playerCollections: { [key: string]: Card[] };
  wildCards: { [key: string]: Card[] };
  summaryCards: { [key: string]: Card[] };
  isRoundCardRevealed: boolean;
  isFirstTurnOfRound: boolean;
  finalScores: { [key: string]: number };
  winner: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameRequest {
  gameName: string;
  maxPlayers: number;
  owner: string;
  difficultyLevel: "Basic" | "Expert";
}

export interface CreateAIGameRequest {
  gameName: string;
  owner: string;
  aiCount: number;
  difficulty: "Basic" | "Expert";
}

export interface JoinGameRequest {
  gameName: string;
  username: string;
}

export interface LeaveGameRequest {
  gameName: string;
  username: string;
}

export interface RevealCardRequest {
  playerName: string;
  columnIndex: number;
}

export interface TakeColumnRequest {
  playerName: string;
  columnIndex: number;
}

export interface AITurnRequest {
  aiPlayerName: string;
}

export interface SelectDifficultyRequest {
  level: "Basic" | "Expert";
}

export interface JoinGameResponse {
  data: GameDetails;
  status: number;
}

export interface LeaveGameResponse {
  data: { message: string };
  status: number;
}

export interface PaginatedGamesResponse {
  games: Game[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalGames: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  gameInfo?: {
    hasAIPlayers: boolean;
    replaceableAICount: number;
    maxPlayers: number;
    currentHumanPlayers: number;
    currentAIPlayers: number;
  }[];
}

export interface GamePreparationResponse {
  game: GameDetails;
  message?: string;
}

export interface RevealCardResponse {
  success: boolean;
  card?: Card;
  roundEnded?: boolean;
  game?: GameDetails;
}

export interface TakeColumnResponse {
  success: boolean;
  takenCards?: Card[];
  wildCards?: Card[];
  normalCards?: Card[];
  game?: GameDetails;
}

export interface RoundEndResponse {
  success: boolean;
  assignedColumns: Map<string, number>;
  nextRound: number;
  isGameEnd?: boolean;
  updatedGameState?: GameDetails;
}

export interface ShouldEndRoundResponse {
  shouldEndRound: boolean;
}

export interface PreparationTimeResponse {
  timeRemaining: number;
}

export interface ReplacementResult {
  success: boolean;
  originalAI: string;
  newPlayer: string;
  message: string;
  gameState?: GameDetails;
}

export interface ReplaceableAIsResponse {
  ais: string[];
}

export interface AITurnAction {
  type: string;
  details?: {
    assignedColumns?: Map<string, number>;
    nextRound?: number;
    isGameEnd?: boolean;
    finalScores?: Record<string, number>;
    winners?: string[];
  };
  card?: Card;
  columnIndex?: number;
  takenCards?: Card[];
  wildCards?: Card[];
  normalCards?: Card[];
  updatedGameState?: GameDetails;
}

export interface AITurnResponse {
  message: string;
  actions: AITurnAction[];
}

export interface ScoreDetails {
  totalCards: number;
  colorDistribution: Record<string, number>;
  topColors: [string, number][];
  cottonCards: number;
  wildCards: number;
  summaryCard: string;
  strategy: string;
  finalScore: number;
}

export interface FinalScoresResponse {
  success: boolean;
  finalScores: { [key: string]: number };
  winners: string[];
  scoreDetails: Record<string, ScoreDetails>;
  game?: GameDetails;
}

export interface ScoreDetail {
  color: string;
  count: number;
  points?: number;
}

export interface WildCardConversion {
  originalType: string;
  convertedColor: string;
  isConverted: boolean;
  count: number;
}

export interface PlayerScoreData {
  username: string;
  isAI: boolean;
  points: number;
  colorDistribution: { [color: string]: number };
  cottonCount: number;
  wildCards: Card[];
  summaryType?: string;
  topThreeColors?: ScoreDetail[];
  negativePointsByColor?: ScoreDetail[];
}

export interface ScoresData {
  players: PlayerScoreData[];
  winner: string[];
}

export interface GameProviderProps {
  children: ReactNode;
}

export interface GameHeaderProps {
  gameName: string;
  isFinished: boolean;
  isPrepared: boolean;
  isPaused?: boolean;
  isReassigning: boolean;
  reassignmentMessage: string;
  endRoundActive: boolean;
  isTurn: boolean;
  turnPlayerName: string;
  currentPlayers: number;
  maxPlayers: number;
}

export interface GameSidebarProps {
  gameDetails: GameDetails;
  endRoundCardInSidebar: boolean;
  getSummaryCardClass: () => string;
  getPlayerSummaryCards: (username: string) => Card[];
  totalPlayers: number;
}

export interface GameCenterProps {
  gameDetails: GameDetails;
  selectedColumnIndex: number | null;
  handleColumnClick: (index: number) => void;
  revealingCard: { isAnimating: boolean; targetColumn?: number };
  columnsContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface PlayerListProps {
  players: string[];
  currentUser: string | undefined;
  owner: string;
  gameDetails: GameDetails;
  getPlayerCollection: (username: string) => Card[];
  getPlayerWildCards: (username: string) => Card[];
  onPlayerClick: (username: string) => void;
}

export interface GameActionsProps {
  isFinished: boolean;
  isOwner: boolean;
  isPrepared: boolean;
  isPaused: boolean;
  canStart: boolean;
  isTurn: boolean;
  hasTakenColumn: boolean;
  selectedColumnIndex: number | null;
  isAnimating: boolean;
  isSelectedColumnFull: boolean;
  activeAction?: "reveal" | "take" | null;
  onStartGame?: () => void;
  onShowScores: () => void;
  onReveal: () => void;
  onTake: () => void;
  onLeave: () => void;
  reassignmentMessage?: string;
  endRoundActive?: boolean;
}

export interface GameOverlaysProps {
  preparationCountdown: number | null;
  isAutoPreparing: boolean;
  showEndRoundOverlay: boolean;
  expandedPlayer: string | null;
  expandedPlayerCards: { collection: Card[]; wild: Card[] };
  onCloseExpanded: () => void;
  isCardZoomed: boolean;
  onCloseZoom: () => void;
  zoomCardType?: string;
}

export interface ScoresOverlayProps {
  scoresData: ScoresData;
  onClose: () => void;
  onZoom: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  getConvertedWildCards: (username: string) => WildCardConversion[];
}

export interface EmoticonProps {
  onSelect: (emoticon: string) => void;
}

export interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export interface FooterProps {
  className?: string;
}

export interface ModalSuccess {
  onClose?: () => void;
}

export interface UseGamePreparationProps {
  gameName: string | undefined;
  user: { username: string } | null;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
}

export interface UseGameReassignmentProps {
  selectedGame: string;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
}

export interface UsePlayerSelectionProps {
  selectedColumnIndex: number | null;
  setSelectedColumnIndex: (index: number | null) => void;
  getPlayerCollection: (username: string) => Card[];
  getPlayerWildCards: (username: string) => Card[];
}

export interface UsePlayerActionsProps {
  gameDetails: GameDetails | null;
  selectedGame: string;
  user: { username: string } | null;
  selectedColumnIndex: number | null;
  setSelectedColumnIndex: (index: number | null) => void;
  isCurrentPlayerTurn: () => boolean;
  isRoundEndAnimationBlocking: boolean;
  showEndRoundOverlay: boolean;
  setGameDetails: React.Dispatch<React.SetStateAction<GameDetails | null>>;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
}

export interface UseGameStatusProps {
  gameDetails: GameDetails | null;
  user: { username: string } | null;
  selectedColumnIndex: number | null;
  setSelectedColumnIndex: (index: number | null) => void;
  getPlayerSummaryCards: (username: string) => Card[];
}

export interface UseGameSyncProps {
  gameName: string | undefined;
  selectedGame: string;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
  setShowScoreTable: (show: boolean) => void;
  showEndRoundOverlay?: boolean;
}

export interface UseGameSocketEventsProps {
  socket: Socket | null;
  gameName: string | undefined;
  user: { username: string } | null;
  fetchGames: () => Promise<void>;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
  setSelectedGame: (game: string) => void;
  setCurrentGameName: (name: string) => void;
  setCurrentUserGame: (name: string) => void;
  isReassigningColumns: boolean;
  showScoresOverlay: boolean;
  gameFinished: boolean;
  handleGameUpdated: () => void;
  handleGameFinalized: () => void;
  handleEndRoundCard: () => void;
  handleCardRevealed: (data: unknown) => void;
  handleReassignmentStarting: (data: {
    gameName: string;
    message: string;
    duration: number;
    round: number;
  }) => void;
  handleReassignmentComplete: (data: {
    gameName: string;
    game: GameDetails;
    round: number;
  }) => void;
  handlePreparationStarted?: (data: {
    difficulty: "Basic" | "Expert";
    gameName: string;
    preparationTime: number;
  }) => void;
}

export interface UseGameScoresProps {
  gameDetails: GameDetails | null;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
  getPlayerCollection: (username: string) => Card[];
  getPlayerWildCards: (username: string) => Card[];
  getPlayerSummaryCards: (username: string) => Card[];
}

export interface UseCardRevealedProps {
  gameName: string | undefined;
  getGameDetails: (gameName: string) => Promise<GameDetails | false>;
  setGameDetails: (game: GameDetails) => void;
  handleEndRoundCard: () => void;
  ignoreAI?: boolean;
}
