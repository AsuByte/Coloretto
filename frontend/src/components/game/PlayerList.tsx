import { useLanguageStore } from "@/context/store/LanguageStore";
import { getCardImage } from "@/hooks/game/useCardImages";
import { PlayerListProps } from "@/types/types";
import crownIcon from "@/assets/owner/crown.webp";

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentUser,
  owner,
  gameDetails,
  getPlayerCollection,
  getPlayerWildCards,
  onPlayerClick,
}) => {
  const t = useLanguageStore((state) => state.t);
  return (
    <div className="players-sidebar" aria-label={t("gamePlayers.label")}>
      {players.map((username) => {
        const collection = getPlayerCollection(username);
        const hiddenCount = Math.max(0, collection.length - 6);
        const wildCards = getPlayerWildCards(username);

        return (
          <div
            key={username}
            className={`player-card 
              ${username === currentUser ? "current-user" : ""} 
              ${
                gameDetails.aiPlayers?.some((ai) => ai.name === username)
                  ? "ai-player"
                  : ""
              }
            `}
            data-testid={`player-card-${username}`}
            data-username={username}
            onClick={() => onPlayerClick(username)}
            aria-label={`${t("gamePlayers.viewCards")} ${username}`}
          >
            <div className="player-header">
              <div className="player-name">
                {username}{" "}
                {username === currentUser && t("gamePlayers.subject")}
                {owner === username && (
                  <span className="owner-crown" title="Owner">
                    <img
                      src={crownIcon}
                      alt={t("gamePlayers.crown")}
                      className="crown-icon"
                    />
                  </span>
                )}
              </div>
              <div className="card-count">
                {(collection.length || 0) + (wildCards.length || 0)}{" "}
                {t("gamePlayers.card")}
              </div>
            </div>

            <div className="player-cards-grid">
              <div className="collection-section">
                <h5>
                  {t("gamePlayers.collection")}
                  {hiddenCount > 0 && (
                    <span
                      style={{
                        fontSize: "0.90em",
                        marginLeft: "3px",
                      }}
                    >
                      (+{hiddenCount})
                    </span>
                  )}
                </h5>
                <div className="collection-stack">
                  {collection.slice(0, 6).map((card, index) => (
                    <img
                      key={index}
                      src={getCardImage(card.color)}
                      alt={`${card.color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="wild-section">
                <h5>{t("gamePlayers.wild")}</h5>
                <div className="wild-stack">
                  {wildCards.slice(0, 4).map((card, index) => (
                    <img
                      key={index}
                      src={getCardImage(card.color)}
                      alt={`${card.color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
