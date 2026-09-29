import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReaderSettings } from '../types/reader'
interface SettingsState extends ReaderSettings { setFontSize: (fontSize: number) => void; setShowPinyin: (showPinyin: boolean) => void; setAutoFollow: (autoFollow: boolean) => void; setPlaybackRate: (playbackRate: number) => void }
export const useSettingsStore = create<SettingsState>()(persist((set) => ({ fontSize: 24, showPinyin: false, autoFollow: true, playbackRate: 1, setFontSize: (fontSize) => set({ fontSize }), setShowPinyin: (showPinyin) => set({ showPinyin }), setAutoFollow: (autoFollow) => set({ autoFollow }), setPlaybackRate: (playbackRate) => set({ playbackRate }) }), { name: 'huangdi-neijing-reader-settings' }))
