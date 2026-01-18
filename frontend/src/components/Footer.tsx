import { useLanguageStore } from "@/context/store/LanguageStore";
import { FooterProps } from "@/types/types";
import chameleon2 from "@/assets/gifs/chameleon2.gif";
import "@/css/Footer.css";

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  const t = useLanguageStore((state) => state.t);
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`footer ${className}`}
      role="contentinfo"
      aria-label={t("footer.label")}
    >
      <img src={chameleon2} className="chameleon2-gif" aria-hidden="true" />

      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <h3 className="footer-title">{t("footer.title")}</h3>
            <p className="footer-tagline">{t("footer.description")}</p>
          </div>

          <dl className="footer-details">
            <div className="detail-row">
              <dt className="detail-label">{t("footer.developer")}</dt>
              <dd className="detail-value">Christian Asuero Carrellán</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">{t("footer.university")}</dt>
              <dd className="detail-value">{t("footer.province")}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">{t("footer.degree")}</dt>
              <dd className="detail-value">{t("footer.nameDegree")}</dd>
            </div>
          </dl>

          <div className="footer-academic">
            <p className="project-info">{t("footer.info")}</p>
            <p className="year-info">{t("footer.year")} 2024-2025</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">{t("footer.copyright")}</p>
          <p className="implementation">
            {t("footer.implementationOne")} {currentYear} -{" "}
            {t("footer.implementationTwo")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;