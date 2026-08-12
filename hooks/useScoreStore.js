import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useScoreStore = create()(
  persist(
    (set, get) => ({

      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      maxScore: 0,
      setMaxScore: (value) => set({ maxScore: value }),

      recentScores: [],
      addRecentScore: (score) =>
        set((state) => ({
          recentScores: [...state.recentScores, score].slice(-5), // Keep only the last 5 scores
        })),

    }),
    {
      name: 'game-score-store', // name of the item in the storage (must be unique)
      version: 1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ![
            "_hasHydrated",
          ].includes(key))
        ),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true)
      },
    },
  ),
)