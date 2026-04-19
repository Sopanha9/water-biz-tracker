import { create } from 'zustand'
import en from '../i18n/en'
import km from '../i18n/km'

const useStore = create((set, get) => ({
  // Auth
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // Language
  lang: localStorage.getItem('lang') || 'en',
  t: localStorage.getItem('lang') === 'km' ? km : en,
  toggleLang: () => {
    const newLang = get().lang === 'en' ? 'km' : 'en'
    localStorage.setItem('lang', newLang)
    set({ lang: newLang, t: newLang === 'km' ? km : en })
  },

  // Online status
  isOnline: navigator.onLine,
  setIsOnline: (v) => set({ isOnline: v }),

  // Sync status
  isSyncing: false,
  setIsSyncing: (v) => set({ isSyncing: v }),
}))

export default useStore
