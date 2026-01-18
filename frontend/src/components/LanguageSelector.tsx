import React, { useState, useRef, useEffect } from "react";
import { useLanguageStore } from "@/context/store/LanguageStore";
import "@/css/Navbar.css";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    setLanguage(code as "en" | "es");
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block", width: "100%" }}
    >
      <button
        type="button"
        className="nav-btn-style"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {t("navbar.language")}
      </button>

      {isOpen && (
        <div className="language-dropdown-menu">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className="language-option"
              onClick={() => handleLanguageChange(lang.code)}
              style={{ fontWeight: language === lang.code ? "bold" : "normal" }}
            >
              <span>{lang.flag}</span> {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
