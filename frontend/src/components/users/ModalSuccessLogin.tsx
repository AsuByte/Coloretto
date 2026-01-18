import { useEffect } from "react";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { ModalSuccess } from "@/types/types";
import "@/css/ModalSuccess.css";

const ModalSuccessLogin: React.FC<ModalSuccess> = ({ onClose }) => {
  const t = useLanguageStore((state) => state.t);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="modal-success" role="alert" aria-live="polite">
      <div className="modal-content">
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <h3>{t("modalLogin.login")}</h3>
        <p>{t("modalLogin.redirect")}</p>
      </div>
    </div>
  );
};

export default ModalSuccessLogin;
