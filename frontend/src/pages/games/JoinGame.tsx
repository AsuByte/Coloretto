import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/context/store/GameStore";
import { useAuth } from "@/constants/data";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { toast } from "react-hot-toast";

const JoinGamePage: React.FC = () => {
  const [gameName, setGameName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { games, fetchGames, joinGame, getGameDetails } = useGameStore();
  const t = useLanguageStore((state) => state.t);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchGames();
  }, [fetchGames, user, navigate]);

  const handleJoinGame = async (joinGameName?: string) => {
    const targetGameName = joinGameName || gameName;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!targetGameName.trim()) {
      const message = t("joinGamePage.trimName");
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      const gameExists = await getGameDetails(targetGameName);
      if (!gameExists) {
        setIsLoading(false);
        return;
      }

      if (gameExists.players.includes(user.username)) {
        navigate(`/play/${encodeURIComponent(targetGameName)}`);
        return;
      }

      if (gameExists.players.length >= gameExists.maxPlayers) {
        setIsLoading(false);
        return;
      }

      if (gameExists.isFinished) {
        const message = t("joinGamePage.finished");
        toast.error(message);
        setIsLoading(false);
        return;
      }

      await joinGame(targetGameName, user.username);
      const message = t("joinGamePage.success");
      toast.success(`${message} ${targetGameName}`);
      navigate(`/play/${encodeURIComponent(targetGameName)}`);
    } catch (error) {
      console.error("Error joining game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickJoin = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const availableGames = games.filter(
        (game) =>
          !game.isFinished &&
          game.players.length < game.maxPlayers &&
          !game.players.includes(user.username)
      );

      if (availableGames.length === 0) {
        setIsLoading(false);
        return;
      }

      const randomGame = availableGames[0];
      await joinGame(randomGame.gameName, user.username);
      const message = t("joinGamePage.success");
      toast.success(`${message} ${randomGame.gameName}`);
      navigate(`/play/${encodeURIComponent(randomGame.gameName)}`);
    } catch (error) {
      console.error("Error in quick join:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isUserInAnyGame = games.some(
    (game) =>
      game.players.includes(user?.username || "") ||
      game.owner === user?.username
  );

  if (!user) {
    return (
      <div className="join-game-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to join games</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-game-container">
      <h1 className="page-title">Join a Game</h1>
      <p className="page-subtitle">Select a game to start playing Coloretto</p>

      <div className="quick-join-section">
        <h3>Quick Join</h3>
        <p>Join the first available game automatically</p>
        <button
          className="quick-join-button"
          onClick={handleQuickJoin}
          disabled={isLoading || games.length === 0}
        >
          {isLoading ? "Joining..." : "Quick Join"}
        </button>
      </div>

      <div className="manual-join-section">
        <h3>Join Specific Game</h3>
        <div className="join-form">
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter game name"
            className="game-name-input"
            onKeyPress={(e) => e.key === "Enter" && handleJoinGame()}
          />
          <button
            onClick={() => handleJoinGame()}
            disabled={isLoading || !gameName.trim()}
            className="join-button"
          >
            {isLoading ? "Joining..." : "Join Game"}
          </button>
        </div>
      </div>

      {games.length > 0 && (
        <div className="available-games-section">
          <h3>Available Games</h3>
          <div className="games-list">
            {games
              .filter(
                (game) =>
                  !game.isFinished && game.players.length < game.maxPlayers
              )
              .map((game) => (
                <div key={game._id} className="game-item">
                  <div className="game-info">
                    <span className="game-name">{game.gameName}</span>
                    <span className="game-details">
                      {game.players.length}/{game.maxPlayers} players •{" "}
                      {game.owner}
                    </span>
                  </div>
                  <button
                    onClick={() => handleJoinGame(game.gameName)}
                    disabled={isLoading || game.players.includes(user.username)}
                    className="join-list-button"
                  >
                    {game.players.includes(user.username)
                      ? "Already Joined"
                      : "Join"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {isUserInAnyGame && (
        <div className="user-status">
          <p>
            You're currently in a game. You can only be in one game at a time.
          </p>
        </div>
      )}

      <div className="navigation-section">
        <button
          onClick={() => navigate("/create")}
          className="create-game-button"
        >
          Create New Game
        </button>
        <button onClick={() => navigate("/play")} className="back-button">
          Back to Game Menu
        </button>
      </div>
    </div>
  );
};

export default JoinGamePage;
