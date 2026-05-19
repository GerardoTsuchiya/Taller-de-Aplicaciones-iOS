import { create } from 'zustand';

interface CoinsState {
  coins: number;
  setCoins: (coins: number) => void;
}

export const useCoinsStore = create<CoinsState>((set) => ({
  coins: 0,
  setCoins: (coins) => set({ coins }),
}));
