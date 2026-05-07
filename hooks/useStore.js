import generateRandomNickname from '@/util/generateRandomNickname';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import typicalZustandStoreExcludes from '@articles-media/articles-dev-box/typicalZustandStoreExcludes';
import typicalZustandStoreStateSlice from '@articles-media/articles-dev-box/typicalZustandStoreStateSlice';

export const useStore = create()(
  persist(
    (set, get) => ({
      ...typicalZustandStoreStateSlice(set, get, generateRandomNickname),
    }),
    {
      name: 'game-storage',
      version: 1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ![
            // Exclude list of keys to not persist
            ...typicalZustandStoreExcludes,
          ].includes(key))
        ),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true)
      },
    },
  ),
)