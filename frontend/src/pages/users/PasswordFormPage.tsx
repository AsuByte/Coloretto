import React, { useState, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/constants/data";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { useParams, useNavigate } from "react-router-dom";
import "@/css/users/PasswordFormPage.css";
import { RiLockPasswordFill, RiLockPasswordLine } from "react-icons/ri";
import { TbPasswordUser } from "react-icons/tb";
import {
  PasswordFormData,
  PasswordFormPageParams,
  PasswordValidation,
} from "@/types/types";

const PasswordFormPage: React.FC = () => {
  const { handleUpdatePassword } = useAuth();
  const t = useLanguageStore((state) => state.t);
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    verifyPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const { username } = useParams<PasswordFormPageParams>();
  const navigate = useNavigate();

  const passwordValidation: PasswordValidation = {
    hasMinLength: formData.newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.newPassword),
    hasLowerCase: /[a-z]/.test(formData.newPassword),
    hasNumber: /[0-9]/.test(formData.newPassword),
    passwordsMatch:
      formData.newPassword === formData.verifyPassword &&
      formData.newPassword.length > 0,
  };

  const isFormValid =
    formData.currentPassword.length > 0 &&
    formData.newPassword.length > 0 &&
    formData.verifyPassword.length > 0 &&
    passwordValidation.hasMinLength &&
    passwordValidation.hasUpperCase &&
    passwordValidation.hasLowerCase &&
    passwordValidation.hasNumber &&
    passwordValidation.passwordsMatch;

  const handleInputChange =
    (field: keyof PasswordFormData) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      setError(null);

      if (field === "newPassword" && e.target.value.length > 0) {
        setShowValidation(true);
      }
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!isFormValid) {
      const message = t("passwordPage.fixErrors");
      setError(message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if(!username) return;
      await handleUpdatePassword(
        username,
        formData.currentPassword,
        formData.newPassword,
        formData.verifyPassword
      );

      navigate(`/users/profile/${username}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
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
    <div
      className="password-form"
      role="main"
      aria-labelledby="password-form-title"
    >
      <header className="form-header">
        <h1 id="password-form-title">{t("passwordPage.title")}</h1>
      </header>

      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="current-password" className="input-label">
            {t("emailPage.currentPassword")}
          </label>
          <div className="input-wrapper">
            <input
              id="current-password"
              type="password"
              placeholder={t("emailPage.currentPassword")}
              value={formData.currentPassword}
              onChange={handleInputChange("currentPassword")}
              required
              disabled={isLoading}
              aria-describedby="current-password-required"
              className={error ? "input-error" : ""}
            />
            <RiLockPasswordFill className="input-icon" aria-hidden="true" />
          </div>
          <span id="current-password-required" className="sr-only">
            {t("emailPage.required")}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="new-password" className="input-label">
            {t("passwordPage.new")}
          </label>
          <div className="input-wrapper">
            <input
              id="new-password"
              type="password"
              placeholder={t("passwordPage.new")}
              value={formData.newPassword}
              onChange={handleInputChange("newPassword")}
              required
              disabled={isLoading}
              aria-describedby="password-requirements"
              className={error ? "input-error" : ""}
            />
            <TbPasswordUser className="input-icon" aria-hidden="true" />
          </div>

          <div
            id="password-requirements"
            className="validation-rules"
            aria-live="polite"
            style={{ display: showValidation ? "block" : "none" }}
          >
            <h4 className="validation-title">
              {t("passwordPage.titleValidate")}
            </h4>
            <ul className="validation-list">
              <li
                className={
                  passwordValidation.hasMinLength ? "valid" : "invalid"
                }
              >
                {t("passwordPage.character")}
              </li>
              <li
                className={
                  passwordValidation.hasUpperCase ? "valid" : "invalid"
                }
              >
                {t("passwordPage.uppercase")}
              </li>
              <li
                className={
                  passwordValidation.hasLowerCase ? "valid" : "invalid"
                }
              >
                {t("passwordPage.lowercase")}
              </li>
              <li
                className={passwordValidation.hasNumber ? "valid" : "invalid"}
              >
                {t("passwordPage.number")}
              </li>
              <li
                className={
                  passwordValidation.passwordsMatch ? "valid" : "invalid"
                }
              >
                {t("passwordPage.match")}
              </li>
            </ul>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="verify-password" className="input-label">
            {t("passwordPage.confirm")}
          </label>
          <div className="input-wrapper">
            <input
              id="verify-password"
              type="password"
              placeholder={t("passwordPage.confirm")}
              value={formData.verifyPassword}
              onChange={handleInputChange("verifyPassword")}
              required
              disabled={isLoading}
              aria-describedby="verify-password-required"
              className={error ? "input-error" : ""}
            />
            <RiLockPasswordLine className="input-icon" aria-hidden="true" />
          </div>
          <span id="verify-password-required" className="sr-only">
            {t("emailPage.required")}
          </span>
        </div>

        <div className="button-group" role="group" aria-label="Form actions">
          <button
            type="submit"
            className="button-updatePassword"
            aria-busy={isLoading}
          >
            {isLoading ? t("emailPage.updating") : t("emailPage.update")}
          </button>
          <button
            type="button"
            className="button-cancelPassword"
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

export default PasswordFormPage;
