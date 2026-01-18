import { createContext, useContext } from "react";
import { AuthContextType } from "@/context/auth.context";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { useGameStore } from "@/context/store/GameStore";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const t = useLanguageStore((state) => state.t);
  const context = useContext(AuthContext);

  if (!context) {
    const message = t("data.useAuth");
    throw new Error(message);
  }

  return context;
};

const GameContext = createContext<ReturnType<typeof useGameStore> | null>(null);

export const useGame = () => {
  const t = useLanguageStore((state) => state.t);
  const context = useContext(GameContext);

  if (!context) {
    const message = t("data.useGame");
    throw new Error(message);
  }

  return context;
};
