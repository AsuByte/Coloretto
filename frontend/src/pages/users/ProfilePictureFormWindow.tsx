import React, { useState, useCallback, ChangeEvent } from "react";
import { useAuth } from "@/constants/data";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { AuthContextType, ProfilePictureFormWindowParams } from "@/types/types";
import { useNavigate, useParams } from "react-router-dom";
import "@/css/users/ProfilePictureFormWindow.css";

const ProfilePictureFormWindow: React.FC = () => {
  const t = useLanguageStore((state) => state.t);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setIsLoading] = useState<boolean>(false);
  const { handleUpdateProfilePicture } = useAuth() as AuthContextType;
  const { username } = useParams<ProfilePictureFormWindowParams>();
  const navigate = useNavigate();

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) {
        setFile(null);
        return;
      }

      if (!selectedFile.type.startsWith("image/")) {
        const message = t("picturePage.errorOne");
        setError(message);
        setFile(null);
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        const message = t("picturePage.errorTwo");
        setError(message);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    },
    [t]
  );

  const handleClose = useCallback((): void => {
    if (username) {
      navigate(`/users/profile/${username}`);
    } else {
      navigate("/");
    }
  }, [username, navigate]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!username) {
      setError("Username not found");
      return;
    }

    if (!file) {
      setError("Please select a valid image file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await handleUpdateProfilePicture(username, file);
      navigate(`/users/profile/${username}`, {
        replace: true,
        state: { refresh: Date.now() },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile picture"
      );
    } finally {
      setIsLoading(false);
    }
  }, [file, username, handleUpdateProfilePicture, navigate]);

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <h2 id="modal-title">{t("picturePage.title")}</h2>

        {error && (
          <div role="alert" className="error-text">
            {error}
          </div>
        )}
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="file-input-container">
            <label htmlFor="fileInput" className="custom-file-label">
              {t("picturePage.selectLabel")}
            </label>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              className="custom-file-input"
            />
            <output className="file-selected">
              {file ? file.name : t("picturePage.noFile")}
            </output>
          </div>

          <div className="button-container">
            <button type="submit" className="button-updatePicture">
              {t("picturePage.update")}
            </button>
            <button
              type="button"
              className="button-cancelPicture"
              onClick={handleClose}
            >
              {t("picturePage.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePictureFormWindow;
