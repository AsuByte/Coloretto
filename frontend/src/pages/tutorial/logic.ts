import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import { useLanguageStore } from "@/context/store/LanguageStore";
import "driver.js/dist/driver.css";
import {
  getInitialTutorialState,
  getInterfaceSteps,
  getMechanicsSteps,
  getScoringSteps,
} from "@/pages/tutorial/data";

export const useTutorial = () => {
  const t = useLanguageStore((state) => state.t);
  const navigate = useNavigate();
  const [tutorialData, setTutorialData] = useState(getInitialTutorialState);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(
    null
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const driverObj = useRef<ReturnType<typeof driver> | null>(null);

  const getPlayerCollection = useCallback(
    (username: string) =>
      tutorialData.playerCollections[
        username as keyof typeof tutorialData.playerCollections
      ] || [],
    [tutorialData]
  );

  const getPlayerWildCards = useCallback(
    (username: string) =>
      tutorialData.wildCards[username as keyof typeof tutorialData.wildCards] ||
      [],
    [tutorialData]
  );

  const getPlayerSummaryCards = useCallback(
    (username: string) =>
      tutorialData.summaryCards[
        username as keyof typeof tutorialData.summaryCards
      ] || [],
    [tutorialData]
  );

  const getAllPlayers = useCallback(
    () => [
      ...tutorialData.players,
      ...tutorialData.aiPlayers.map((ai) => ai.name),
    ],
    [tutorialData]
  );

  const simulateScoreExample = useCallback(() => {
    const nameYou = t("tutorialJSX.you");
    setIsAutoPlaying(true);

    setTimeout(() => {
      setTutorialData((prev) => ({
        ...prev,
        columns: prev.columns.map((col, idx) =>
          idx === 1 ? { cards: [] } : col
        ),
        playerCollections: {
          ...prev.playerCollections,
          [nameYou]: [
            ...prev.playerCollections[nameYou],
            { color: "yellow" },
            { color: "cotton" },
          ],
        },
        playersTakenColumn: ["You"],
        currentPlayerIndex: 1,
      }));
      setSelectedColumnIndex(null);
    }, 1000);

    setTimeout(() => {
      driverObj.current?.destroy();
      const drv = driver({
        showProgress: true,
        animate: true,
        popoverClass: "tutorial-popover",
        allowClose: true,
        doneBtnText: t("tutorialLogic.finish"),
        onDestroyed: () => navigate("/"),
      });
      drv.setSteps(getScoringSteps());
      drv.drive();
      driverObj.current = drv;
    }, 2500);
  }, [navigate, t]);

  const startMechanics = useCallback(() => {
    driverObj.current?.destroy();
    setSelectedColumnIndex(1);

    setTimeout(() => {
      const drv = driver({
        showProgress: true,
        animate: true,
        popoverClass: "tutorial-popover",
        doneBtnText: t("tutorialLogic.scoring") + "→",
        nextBtnText: t("tutorialLogic.next"),
        prevBtnText: t("tutorialLogic.back"),
        onDestroyed: () => simulateScoreExample(),
      });
      drv.setSteps(getMechanicsSteps());
      drv.drive();
      driverObj.current = drv;
    }, 500);
  }, [simulateScoreExample, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const drv = driver({
        showProgress: true,
        animate: true,
        popoverClass: "tutorial-popover",
        doneBtnText: t("tutorialLogic.mechanics") + "→",
        nextBtnText: t("tutorialLogic.next"),
        prevBtnText: t("tutorialLogic.back"),
        onDestroyed: () => startMechanics(),
      });
      drv.setSteps(getInterfaceSteps());
      drv.drive();
      driverObj.current = drv;
    }, 500);

    return () => clearTimeout(timer);
  }, [startMechanics, t]);

  useEffect(() => {
    return () => {
      if (driverObj.current) driverObj.current.destroy();
    };
  }, []);

  const handleSkip = () => {
    driverObj.current?.destroy();
    navigate("/");
  };

  return {
    tutorialData,
    selectedColumnIndex,
    isAutoPlaying,
    getPlayerCollection,
    getPlayerWildCards,
    getPlayerSummaryCards,
    getAllPlayers,
    handleColumnClick: (index: number) => {
      if (!isAutoPlaying)
        setSelectedColumnIndex(index === selectedColumnIndex ? null : index);
    },
    handleSkip,
  };
};
