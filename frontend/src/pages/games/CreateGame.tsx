import React, { useState, useEffect } from "react";
import { useGameStore } from "@/context/store/GameStore";
import { useAuth } from "@/constants/data";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { toast } from "react-hot-toast";
import "@/css/games/CreateGame.css";

const CreateGame: React.FC = () => {
  const t = useLanguageStore((state) => state.t);
  const { games, createGame, createAIGameOnly } = useGameStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gameName, setGameName] = useState("");
  const [error, setError] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [isAiControlled, setIsAiControlled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameCreated, setIsGameCreated] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState("Basic");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const isInAnyGame = games.some(
    (game) =>
      game.players.includes(user?.username || "") ||
      game.owner === user?.username,
  );

  const handleCreateGame = async () => {
    if (!user) return;

    if (isInAnyGame) {
      const message = t("createGame.anyGame");
      toast(message);
      navigate("/play/join");
      return;
    }

    if (!gameName.trim()) {
      const message = t("createGame.empty");
      setError(message);
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 5) {
      const message = t("createGame.numberPlayers");
      setError(message);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (isAiControlled) {
        const aiCount = maxPlayers - 1;
        await createAIGameOnly(
          gameName,
          user.username,
          aiCount,
          difficultyLevel as "Basic" | "Expert",
        );
      } else {
        await createGame(gameName, maxPlayers, user.username, difficultyLevel);
      }

      setIsGameCreated(true);
      setTimeout(() => {
        if (isAiControlled) {
          navigate(`/play/ai/${gameName}`);
        } else {
          navigate(`/play/players/${gameName}`);
        }
      }, 2000);
    } catch (error) {
      setError("Error creating game. Please try again.");
      console.error("Error creating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-game-container">
      <h1>{t("createGame.title")}</h1>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="inputs">
        <input
          type="text"
          data-testid="input-game-name"
          name="nameGame"
          placeholder={t("createGame.gameNameJSX")}
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />
      </div>

      <div className="inputsPlayers">
        <label>{t("createGame.numberPlayersJSX")}</label>

        <div className="counter-controls">
          <button
            type="button"
            onClick={() => setMaxPlayers((prev) => Math.max(2, prev - 1))}
            disabled={maxPlayers <= 2}
            className="counter-btn minus-btn"
          >
            -
          </button>

          <div className="player-display">
            <span className="counter-value">{maxPlayers}</span>
          </div>

          <button
            type="button"
            onClick={() => setMaxPlayers((prev) => Math.min(5, prev + 1))}
            disabled={maxPlayers >= 5}
            className="counter-btn plus-btn"
          >
            +
          </button>
        </div>
      </div>

      <div className="inputs">
        <label>
          <p className="verify">{t("createGame.aiJSX")}</p>
          <input
            name="verify"
            data-testid="checkbox-ai"
            type="checkbox"
            checked={isAiControlled}
            onChange={(e) => setIsAiControlled(e.target.checked)}
          />
        </label>
      </div>

      <div className="inputsLevel">
        <label id="titleLevel">
          {t("createGame.difficulty")}
          <select
            name="level"
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(e.target.value)}
          >
            <option className="option" value="Basic">
              {t("createGame.basic")}
            </option>
            <option className="option" value="Expert">
              {t("createGame.expert")}
            </option>
          </select>
        </label>
      </div>

      {isGameCreated ? (
        <p className="gameCreate">{t("createGame.redirect")}</p>
      ) : (
        <button
          className="createGame"
          data-testid="btn-create-game"
          onClick={handleCreateGame}
          disabled={isLoading}
        >
          {isLoading ? t("createGame.creating") : t("createGame.create")}
        </button>
      )}
    </div>
  );
};

export default CreateGame;
