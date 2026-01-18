import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth } from "@/constants/data";
import { useNavigate, Link } from "react-router-dom";
import { RegisterFormData, AuthResponseError } from "@/types/types";
import { useLanguageStore } from "@/context/store/LanguageStore";
import ModalSuccessRegister from "@/components/users/ModalSuccessRegister";
import "@/css/users/RegisterPage.css";
import { FaHouseUser, FaUser, FaEnvelope } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";

const getTranslatedError = (
  errorMsg: string | string[],
  t: (key: string) => string,
): string => {
  if (!errorMsg) return "";
  const msg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
  const lowerMsg = msg.toString().toLowerCase();

  if (lowerMsg.includes("email") && lowerMsg.includes("exist"))
    return t("register.errors.emailExists");
  if (lowerMsg.includes("user") && lowerMsg.includes("exist"))
    return t("register.errors.userExists");
  if (lowerMsg.includes("server")) return t("errors.server");
  return t("register.generic");
};

const RegisterPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: "onChange",
    defaultValues: {
      fullname: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const { signUp, authenticated, error: registerError } = useAuth();
  const navigate = useNavigate();
  const t = useLanguageStore((state) => state.t);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit: SubmitHandler<RegisterFormData> = useCallback(
    async (data: RegisterFormData) => {
      setIsSubmitting(true);
      setLocalError(null);

      try {
        await signUp(data);
        setShowModal(true);

        const timer = setTimeout(() => {
          navigate("/auth/login", { replace: true });
        }, 5000);

        return () => clearTimeout(timer);
      } catch (error) {
        const authError = error as AuthResponseError;

        if (authError.response?.data?.message) {
          setLocalError(authError.response.data.message);
        } else if (error instanceof Error) {
          setLocalError(error.message);
        } else {
          setLocalError("An unexpected error occurred during registration.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [signUp, navigate],
  );

  useEffect(() => {
    if (authenticated) {
      navigate("/", { replace: true });
    }
  }, [authenticated, navigate]);

  const handleInputFocus = (): void => {
    setLocalError(null);
  };

  return (
    <main className="register-container" aria-labelledby="register-title">
      <header className="register-header">
        <h1 id="register-title">{t("register.title")}</h1>
      </header>

      {(localError || registerError) && (
        <div className="error-message" role="alert" aria-live="assertive">
          {getTranslatedError(localError || registerError || "", t)}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`register-form ${isSubmitting ? "submitted" : ""}`}
        noValidate
      >
        <div className="form-group">
          <label htmlFor="fullname" className="input-label">
            {t("register.fullname")}
          </label>
          <div className="input-wrapper">
            <input
              id="fullname"
              type="text"
              placeholder={t("register.fullnamePlaceholder")}
              className={errors.fullname ? "input-error" : ""}
              aria-invalid={errors.fullname ? "true" : "false"}
              aria-describedby={errors.fullname ? "fullname-error" : undefined}
              onFocus={handleInputFocus}
              {...register("fullname", {
                required: t("register.errors.fullnameRequired"),
                minLength: {
                  value: 3,
                  message: t("register.errors.fullnameMin"),
                },
                maxLength: {
                  value: 30,
                  message: t("register.errors.fullnameMax"),
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: t("register.errors.fullnamePattern"),
                },
              })}
            />
            <FaHouseUser className="input-icon" aria-hidden="true" />
          </div>
          {errors.fullname && (
            <span id="fullname-error" className="field-error" role="alert">
              {errors.fullname.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="username" className="input-label">
            {t("register.username")}
          </label>
          <div className="input-wrapper">
            <input
              id="username"
              type="text"
              placeholder={t("register.usernamePlaceholder")}
              className={errors.username ? "input-error" : ""}
              aria-invalid={errors.username ? "true" : "false"}
              aria-describedby={errors.username ? "username-error" : undefined}
              onFocus={handleInputFocus}
              {...register("username", {
                required: t("register.errors.usernameRequired"),
                minLength: {
                  value: 3,
                  message: t("register.errors.usernameMin"),
                },
                maxLength: {
                  value: 20,
                  message: t("register.errors.usernameMax"),
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: t("register.errors.usernamePattern"),
                },
              })}
            />
            <FaUser className="input-icon" aria-hidden="true" />
          </div>
          {errors.username && (
            <span id="username-error" className="field-error" role="alert">
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="input-label">
            {t("register.email")}
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              className={errors.email ? "input-error" : ""}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              onFocus={handleInputFocus}
              {...register("email", {
                required: t("register.errors.emailRequired"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("register.errors.emailPattern"),
                },
              })}
            />
            <FaEnvelope className="input-icon" aria-hidden="true" />
          </div>
          {errors.email && (
            <span id="email-error" className="field-error" role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="input-label">
            {t("register.password")}
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              type="password"
              placeholder={t("register.passwordPlaceholder")}
              className={errors.password ? "input-error" : ""}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              onFocus={handleInputFocus}
              {...register("password", {
                required: t("register.errors.passwordRequired"),
                minLength: {
                  value: 8,
                  message: t("register.errors.passwordMin"),
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: t("register.errors.passwordPattern"),
                },
              })}
            />
            <RiLockPasswordFill className="input-icon" aria-hidden="true" />
          </div>
          {errors.password && (
            <span id="password-error" className="field-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={`submit-button ${isSubmitting ? "loading" : ""}`}
          aria-busy={isSubmitting}
        >
          {t("register.submit")}
        </button>
      </form>

      <footer className="register-footer">
        <p className="login-link">
          {t("register.haveAccount")}{" "}
          <Link
            to="/auth/login"
            className="link"
            aria-label={t("register.signInAria")}
          >
            {t("register.signIn")}
          </Link>
        </p>
      </footer>

      {showModal && (
        <ModalSuccessRegister
          onClose={() => {
            setShowModal(false);
            navigate("/auth/login", { replace: true });
          }}
        />
      )}
    </main>
  );
};

export default RegisterPage;
