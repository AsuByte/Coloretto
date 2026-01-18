import { useLanguageStore } from "@/context/store/LanguageStore";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/constants/data";
import camaleonGif from "@/assets/gifs/camaleon1.gif";
import "@/css/Navbar.css";

const Navbar: React.FC = () => {
  const { authenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useLanguageStore((state) => state.t);

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    logout();
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  const shouldHideMenu =
    location.pathname.includes("/play/players/") ||
    location.pathname.includes("/play/ai/");

  const isAuthPage =
    location.pathname === "/auth/login" ||
    location.pathname === "/users/register";

  if (shouldHideMenu) {
    return null;
  }

  return (
    <nav
      className={`${shouldHideMenu ? "hide-menu" : ""} ${
        isAuthPage ? "auth-page" : ""
      }`}
    >
      <h1>
        <Link to="/">
          Coloretto{" "}
          <img
            src={camaleonGif}
            alt={t("navbar.chameleon")}
            className="camaleon"
          />
        </Link>
      </h1>

      <div className="navbar-right">
        {!isAuthPage && (
          <ul className="nav-links">
            {authenticated ? (
              <>
                <li>
                  <Link to="/play">{t("navbar.play")}</Link>
                </li>
                <li>
                  <Link to="/chat">Chat</Link>
                </li>
                <li>
                  <Link to={`/users/profile/${user?.username}`}>
                    {t("navbar.profile")}
                  </Link>
                </li>
                <li>
                  <Link to="/tutorial">Tutorial</Link>
                </li>
                <li>
                  <LanguageSelector />
                </li>
                <li>
                  <Link to="/" data-testid="btn-logout" onClick={handleLogout}>
                    {t("navbar.logout")}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/auth/login">{t("navbar.login")}</Link>
                </li>
                <li>
                  <Link to="/users/register">{t("navbar.register")}</Link>
                </li>
                <li>
                  <LanguageSelector />
                </li>
              </>
            )}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
