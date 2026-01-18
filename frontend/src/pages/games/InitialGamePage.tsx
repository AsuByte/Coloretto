import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/context/store/GameStore";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { useAuth } from "@/constants/data";
import "@/css/games/InitialGamePage.css";

const InitialGamePage: React.FC = () => {
  const navigate = useNavigate();
  const t = useLanguageStore((state) => state.t);
  const { fetchUserGame } = useGameStore();
  const { user } = useAuth();
  const [hasGame, setHasGame] = useState<boolean>(false);
  const [colorIndex, setColorIndex] = useState(0);

  const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8"];

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const { initializeStore } = useGameStore.getState();
    initializeStore();
  }, [user, navigate]);

  useEffect(() => {
    const checkUserGame = async () => {
      if (!user) return;

      try {
        const userGame = await fetchUserGame(user.username);

        if (userGame) {
          setHasGame(true);
          navigate(`/play/players/${userGame.gameName}`);
        } else {
          setHasGame(false);
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const apiError = error as { response?: { status?: number } };
          if (apiError.response?.status === 404) {
            setHasGame(false);
          } else {
            console.error("Error fetching user game:", error);
            setHasGame(false);
          }
        } else {
          console.error("Error fetching user game:", error);
          setHasGame(false);
        }
      }
    };

    checkUserGame();
  }, [user, fetchUserGame, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [colors.length]);

  const handleCreateGame = () => {
    navigate("/create");
  };

  const handleJoinGame = () => {
    navigate("/play/join");
  };

  return (
    <main className="container">
      <h1 className="welcome-title">{t("initialGamePage.start")}</h1>

      <nav className="buttons">
        {!hasGame && (
          <button
            data-testid="btn-go-to-create"
            className="create-game"
            style={{ backgroundColor: colors[colorIndex] }}
            onClick={handleCreateGame}
          >
            {t("initialGamePage.create")}
          </button>
        )}
        <button
          className="join-game"
          style={{ backgroundColor: colors[colorIndex] }}
          onClick={handleJoinGame}
        >
          {hasGame ? t("initialGamePage.back") : t("initialGamePage.join")}
        </button>
      </nav>

      {hasGame && (
        <section className="active-game-notice">
          <button
            className="manual-redirect-button"
            onClick={() => navigate("/play/join")}
          >
            {t("initialGamePage.list")}
          </button>
        </section>
      )}
    </main>
  );
};

export default InitialGamePage;
