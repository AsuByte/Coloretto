import React, { useState, FormEvent, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/constants/data";
import { useLanguageStore } from "@/context/store/LanguageStore";
import "@/css/users/EmailFormPage.css";
import { FaEnvelope } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { isAxiosError } from "axios";

export interface EmailFormPageParams extends Record<
  string,
  string | undefined
> {
  username: string;
}

export interface FormData {
  email: string;
  password: string;
}

const EmailFormPage: React.FC = () => {
  const { handleUpdateEmail } = useAuth();
  const t = useLanguageStore((state) => state.t);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { username } = useParams<EmailFormPageParams>();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleInputChange =
    (field: keyof FormData) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      setError(null);
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      const message = t("emailPage.fields");
      setError(message);
      return;
    }

    if (!validateEmail(formData.email)) {
      const message = t("emailPage.emailPattern") || "Invalid email format";
      setError(message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!username) return;
      await handleUpdateEmail(username, formData.password, formData.email);
      navigate(`/users/profile/${username}`);
    } catch (error) {
      let message = t("register.generic");

      if (isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        const serverMessage = (data as { message?: string })?.message;

        if (status === 409) {
          message = t("emailPage.emailExists");
        } else if (serverMessage) {
          message = serverMessage;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (username) {
      navigate(`/users/profile/${username}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="email-form" role="main" aria-labelledby="email-form-title">
      <h2 id="email-form-title">{t("emailPage.title")}</h2>

      {error && (
        <div className="error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="input-group">
          <label htmlFor="current-password" className="sr-only">
            {t("emailPage.currentPassword")}
          </label>
          <div className="input-wrapper">
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              placeholder={t("emailPage.currentPassword")}
              value={formData.password}
              onChange={handleInputChange("password")}
              required
              disabled={isLoading}
              aria-describedby="password-required"
              className={error ? "error-input" : ""}
            />
            <RiLockPasswordFill className="input-icon" aria-hidden="true" />
          </div>
          <span id="password-required" className="sr-only">
            {t("emailPage.required")}
          </span>
        </div>

        <div className="input-group">
          <label htmlFor="new-email" className="sr-only">
            {t("emailPage.newEmail")}
          </label>
          <div className="input-wrapper">
            <input
              id="new-email"
              name="newEmail"
              type="email"
              placeholder={t("emailPage.newEmail")}
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              disabled={isLoading}
              aria-describedby="email-required"
              className={error ? "error-input" : ""}
            />
            <FaEnvelope className="input-icon" aria-hidden="true" />
          </div>
          <span id="email-required" className="sr-only">
            {t("emailPage.required")}
          </span>
        </div>

        <div className="button-group" role="group" aria-label="Form actions">
          <button
            type="submit"
            className="button-updateEmail"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? t("emailPage.updating") : t("emailPage.update")}
          </button>
          <button
            type="button"
            className="button-cancelEmail"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t("emailPage.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailFormPage;
