import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  myClubs: string[];
  primaryClub: string | null;
  _hasHydrated: boolean;
  addClub: (clubId: string) => void;
  removeClub: (clubId: string) => void;
  setPrimaryClub: (clubId: string | null) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      myClubs: [],
      primaryClub: null,
      _hasHydrated: false,
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
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "premier-league-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

