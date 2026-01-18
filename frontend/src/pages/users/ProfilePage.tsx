import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/constants/data";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/context/store/LanguageStore";
import "@/css/users/ProfilePage.css";
import { BsFillPencilFill } from "react-icons/bs";
import { HiStatusOnline } from "react-icons/hi";
import { GiCardDraw } from "react-icons/gi";

const ProfilePage: React.FC = () => {
  const {
    user,
    loading,
    error,
    authenticated,
    connectionTime,
    deleteUserAccount,
  } = useAuth();
  const t = useLanguageStore((state) => state.t);
  const navigate = useNavigate();
  const [successMessage] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!authenticated && !loading) {
      navigate("/auth/login", { replace: true });
    }
  }, [authenticated, loading, navigate]);

  useEffect(() => {}, [user?.profile?.profilePicture]);

  useEffect(() => {
    if (localStorage.getItem("reloadProfile") === "true") {
      localStorage.removeItem("reloadProfile");
      window.location.reload();
    }
  }, []);

  const handleDeleteAccount = useCallback(async (): Promise<void> => {
    const message = t("profilePage.confirmDelete");
    const isConfirmed = window.confirm(message);

    if (!isConfirmed) return;

    setIsDeleting(true);

    try {
      if (!user?.profile?.username) return;
      await deleteUserAccount(user.profile.username);
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Account deletion error:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [user, deleteUserAccount, navigate, t]);

  const navigateToEmailUpdate = useCallback((): void => {
    if (user?.profile?.username) {
      navigate(`/users/profile/${user.profile.username}/change-email`);
    }
  }, [user, navigate]);

  const navigateToPasswordUpdate = useCallback((): void => {
    if (user?.profile?.username) {
      navigate(`/users/profile/${user.profile.username}/change-password`);
    }
  }, [user, navigate]);

  const navigateToProfilePictureUpdate = useCallback((): void => {
    if (user?.profile?.username) {
      navigate(
        `/users/profile/${user.profile.username}/update-profile-picture`,
      );
    }
  }, [user, navigate]);

  const winRate = user?.profile?.gamesPlayed
    ? ((user.profile.gamesWon / user.profile.gamesPlayed) * 100).toFixed(2)
    : "0.0";

  if (!authenticated) {
    return (
      <div className="profile-container" role="main">
        <div className="auth-error" role="alert">
          <p>Authentication required. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="profile-container">
      <h2>{t("profilePage.title")}</h2>

      {loading ? (
        <p>{t("profilePage.loading")}</p>
      ) : error ? (
        <p>{t("profilePage.error", { error })}</p>
      ) : (
        <div className="profile-info">
          {successMessage && <div className="alert">{successMessage}</div>}

          {user && user.profile && (
            <div className="user-details">
              <figure className="profile-picture">
                {user.profile.profilePicture && (
                  <img
                    className="photo"
                    src={user.profile.profilePicture}
                    alt={t("profilePage.photoAlt")}
                    onClick={navigateToProfilePictureUpdate}
                  />
                )}
                <div className="connection-status">
                  <HiStatusOnline className="status-icon" />
                  <p>{connectionTime || t("profilePage.connectionTime")}</p>
                </div>
              </figure>

              <div className="user-data">
                <p>
                  <strong>{t("profilePage.labelName")}</strong>{" "}
                  {user.profile.fullname}
                </p>
                <p>
                  <strong>{t("profilePage.labelUser")}</strong>{" "}
                  {user.profile.username}
                </p>
                <p>
                  <strong>{t("profilePage.labelEmail")}</strong>{" "}
                  {user.profile.email}
                  <BsFillPencilFill
                    className="update-icon"
                    title={t("profilePage.updateEmailTitle")}
                    onClick={navigateToEmailUpdate}
                  />
                </p>
              </div>

              <div className="user-stats">
                <GiCardDraw className="icon-game" />
                <p className="games">
                  {t("profilePage.stats.played", {
                    count: user.profile.gamesPlayed,
                  })}
                </p>
                <p className="games">
                  {t("profilePage.stats.won", { count: user.profile.gamesWon })}
                </p>
                <p className="games">
                  {t("profilePage.stats.lost", {
                    count: user.profile.gamesLost,
                  })}
                </p>
                <p className="games">
                  {t("profilePage.stats.rate", { rate: winRate })}
                </p>
              </div>

              <div className="user-actions">
                <button
                  className="button-password"
                  onClick={navigateToPasswordUpdate}
                >
                  {t("profilePage.btn.password")}
                </button>
                <button
                  className="button-delete"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? t("profilePage.btn.deleting")
                    : t("profilePage.btn.delete")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProfilePage;
