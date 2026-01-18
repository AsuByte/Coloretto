import React, { createContext } from 'react';
import { useGameStore } from "@/context/store/GameStore";
import { GameProviderProps } from '@/types/types';

const GameContext = createContext<ReturnType<typeof useGameStore> | null>(null);

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const gameStore = useGameStore();
  
  return (
    <GameContext.Provider value={gameStore}>
      {children}
    </GameContext.Provider>
  );
};