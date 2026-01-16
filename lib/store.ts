import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppState {
  myClubs: string[];
  primaryClub: string | null;
  addClub: (clubId: string) => void;
  removeClub: (clubId: string) => void;
  setPrimaryClub: (clubId: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      myClubs: [],
      primaryClub: null,
      addClub: (clubId: string) =>
        set((state) => {
          if (state.myClubs.includes(clubId)) return state;
          if (state.myClubs.length >= 5) return state;
          return { myClubs: [...state.myClubs, clubId] };
        }),
      removeClub: (clubId: string) =>
        set((state) => ({
          myClubs: state.myClubs.filter((id) => id !== clubId),
          primaryClub:
            state.primaryClub === clubId ? null : state.primaryClub,
        })),
      setPrimaryClub: (clubId: string | null) =>
        set({ primaryClub: clubId }),
    }),
    {
      name: "premier-league-storage",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as any;
        }
        return localStorage;
      }),
    }
  )
);

