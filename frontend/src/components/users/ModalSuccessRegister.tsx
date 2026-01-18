import { useLanguageStore } from "@/context/store/LanguageStore";
import { ModalSuccess } from "@/types/types";
import { useEffect } from "react";
import "@/css/ModalSuccess.css";

const ModalSuccessRegister: React.FC<ModalSuccess> = ({ onClose }) => {
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
        <h3>{t("modalRegister.register")}</h3>
        <p>{t("modalRegister.redirect")}</p>
      </div>
    </div>
  );
};

export default ModalSuccessRegister;
