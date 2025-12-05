import { create } from "zustand";

interface PseudonymState {
  pseudonym: string;
  setPseudonym: (p: string) => void;
}

export const usePseudonymStore = create<PseudonymState>((set) => ({
  pseudonym: "",
  setPseudonym: (pseudonym) => set({ pseudonym }),
}));
