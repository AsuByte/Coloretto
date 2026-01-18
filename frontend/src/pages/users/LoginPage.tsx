import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth } from "@/constants/data";
import { AuthResponseError, LoginFormData } from "@/types/types";
import { useNavigate, Link } from "react-router-dom";
import { useLanguageStore } from "@/context/store/LanguageStore";
import ModalSuccessLogin from "@/components/users/ModalSuccessLogin";
import "@/css/users/LoginPage.css";
import { FaUser } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";

const getTranslatedError = (
  errorMsg: string | string[],
  t: (key: string) => string,
): string => {
  if (!errorMsg) return "";
  const msg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
  const lowerMsg = msg.toString().toLowerCase();

  if (
    lowerMsg.includes("user") &&
    (lowerMsg.includes("exist") || lowerMsg.includes("found"))
  )
    return t("loginPage.userNoExists");
  if (lowerMsg.includes("password") || lowerMsg.includes("incorrect"))
    return t("loginPage.passwordNoExists");
  if (lowerMsg.includes("server")) return t("errors.server");
  return t("loginPage.generic");
};

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { loading, user, signIn, error: loginError, authenticated } = useAuth();
  const navigate = useNavigate();
  const t = useLanguageStore((state) => state.t);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState<boolean>(false);

  const onSubmit: SubmitHandler<LoginFormData> = useCallback(
    async (data: LoginFormData) => {
      try {
        setLocalError(null);
        const isSuccess = await signIn(data);

        if (isSuccess) {
          setShowModal(true);
          setIsLoginSuccessful(true);

          setTimeout(() => {
            setShowModal(false);
            navigate("/", { replace: true });
          }, 3000);
        }
      } catch (error) {
        const authError = error as AuthResponseError;

        if (authError.response?.data?.message) {
          setLocalError(authError.response.data.message);
        } else if (error instanceof Error) {
          setLocalError(error.message);
        } else {
          setLocalError("An unexpected error occurred during login");
        }
      }
    },
    [signIn, navigate],
  );

  useEffect(() => {
    if (authenticated && !loading && user && !isLoginSuccessful) {
      navigate("/", { replace: true });
    }
  }, [authenticated, loading, user, isLoginSuccessful, navigate]);

  const handleInputFocus = (): void => {
    setLocalError(null);
  };

  return (
    <main className="login-container" role="main" aria-labelledby="login-title">
      <header className="login-header">
        <h1 id="login-title">{t("loginPage.title")}</h1>
      </header>

      {(localError || loginError) && (
        <div className="error-message" role="alert" aria-live="assertive">
          {getTranslatedError(localError || loginError || "", t)}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
        <div className="form-group">
          <label htmlFor="username-login" className="sr-only">
            {t("loginPage.username")}
          </label>
          <div className="input-wrapper">
            <input
              id="username-login"
              data-testid="login-username"
              type="text"
              placeholder={t("loginPage.username")}
              className={errors.username ? "input-error" : ""}
              aria-invalid={errors.username ? "true" : "false"}
              aria-describedby={errors.username ? "username-error" : undefined}
              onFocus={handleInputFocus}
              {...register("username", {
                required: t("loginPage.errorUsernameOne"),
                minLength: {
                  value: 3,
                  message: t("loginPage.errorUsernameTwo"),
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: t("loginPage.errorUsernameThree"),
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
          <label htmlFor="password" className="sr-only">
            {t("loginPage.password")},
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              data-testid="login-password"
              type="password"
              placeholder={t("loginPage.password")}
              className={errors.password ? "input-error" : ""}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              onFocus={handleInputFocus}
              {...register("password", {
                required: t("loginPage.errorPasswordOne"),
                minLength: {
                  value: 8,
                  message: t("loginPage.errorPasswordTwo"),
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
          data-testid="login-submit"
          className={`submit-button ${loading ? "loading" : ""}`}
          aria-busy={loading}
        >
          {t("loginPage.signIn")}
        </button>
      </form>

      <footer className="login-footer">
        <p className="register-link">
          {t("loginPage.account")}{" "}
          <Link
            to="/users/register"
            className="link"
            aria-label={t("loginPage.create")}
          >
            {t("loginPage.createHere")}
          </Link>
        </p>
      </footer>

      {showModal && (
        <ModalSuccessLogin
          onClose={() => {
            setShowModal(false);
            navigate("/", { replace: true });
          }}
        />
      )}
    </main>
  );
};

export default LoginPage;
