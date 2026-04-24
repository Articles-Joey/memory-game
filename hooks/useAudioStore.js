import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAudioStore = create()(
  persist(
    (set, get) => ({

      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },

      audioSettings: {
        enabled: true,
        backgroundMusicVolume: 15,
        soundEffectsVolume: 50,
      },
      setAudioSettings: (newValue) => set({ audioSettings: newValue }),

    }),
    {
      name: 'audio-store', // name of the item in the storage (must be unique)
      version: 1,
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true)
      },
      partialize: (state) => ({
        audioSettings: state.audioSettings,
      }),
    },
  ),
)