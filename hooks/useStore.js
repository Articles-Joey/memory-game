import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create()(
  persist(
    (set, get) => ({

      darkMode: true,
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      setDarkMode: (newValue) => {
        set((prev) => ({
          darkMode: newValue
        }))
      },

      nickname: '',
      setNickname: (newValue) => {
        set((prev) => ({
          nickname: newValue
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
          ].includes(key))
        ),
    },
  ),
)