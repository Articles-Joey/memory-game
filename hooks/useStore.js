import generateRandomNickname from '@/util/generateRandomNickname';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create()(
  persist(
    (set, get) => ({

      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },

      darkMode: true,
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      setDarkMode: (newValue) => {
        set((prev) => ({
          darkMode: newValue
        }))
      },

      nickname: generateRandomNickname(),
      setNickname: (newValue) => {
        set((prev) => ({
          nickname: newValue
        }))
      },
      randomNickname: () => {
        const newNickname = generateRandomNickname();
        set((prev) => ({
          nickname: newNickname
        }))
      },

      nicknameKeyboard: false,
      setNicknameKeyboard: (newValue) => {
        set((prev) => ({
          nicknameKeyboard: newValue
        }))
      },

      debug: 0,
      setDebug: (newValue) => {
        set((prev) => ({
          debug: newValue
        }))
      },

      sidebar: true,
      toggleSidebar: () => {
        set((prev) => ({
          sidebar: !prev.sidebar
        }))
      },
      setSidebar: (newValue) => {
        set((prev) => ({
          sidebar: newValue
        }))
      },

      showMenu: false,
      setShowMenu: (value) => set({ showMenu: value }),

      showSettingsModal: false,
      setShowSettingsModal: (newValue) => {
        set((prev) => ({
          showSettingsModal: newValue
        }))
      },

      showInfoModal: false,
      setShowInfoModal: (newValue) => {
        set((prev) => ({
          showInfoModal: newValue
        }))
      },

      showCreditsModal: false,
      setShowCreditsModal: (newValue) => {
        set((prev) => ({
          showCreditsModal: newValue
        }))
      },

      graphicsQuality: "High",
      setGraphicsQuality: (value) => set({ graphicsQuality: value }),

      lobbyDetails: {
        players: [],
        games: [],
      },
      setLobbyDetails: (lobbyDetails) => set({ lobbyDetails }),

      landingAnimation: true,
      setLandingAnimation: (value) => set({ landingAnimation: value }),
      toggleLandingAnimation: () => set({ landingAnimation: !get().landingAnimation }),

      toontownMode: false,
      toggleToontownMode: () => {
        set((prev) => ({
          toontownMode: !prev.toontownMode
        }))
      },
      setToontownMode: (newValue) => {
        set((prev) => ({
          toontownMode: newValue
        }))
      },

      showGameOverModal: false,
      setShowGameOverModal: (newValue) => {
        set((prev) => ({
          showGameOverModal: newValue
        }))
      },

    }),
    {
      name: 'memory-game-storage', // name of the item in the storage (must be unique)
      // storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      version: 1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ![
            // Exclude list of keys to not persist
            'showSettingsModal',
            'showInfoModal',
            'showCreditsModal',
            'showGameOverModal',
            '_hasHydrated',
            'lobbyDetails'
          ].includes(key))
        ),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true)
      },
    },
  ),
)