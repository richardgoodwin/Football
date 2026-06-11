import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColourblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface SettingsState {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  colourblind: ColourblindMode;
  fontScale: number;
  set: <K extends keyof Omit<SettingsState, 'set'>>(key: K, value: SettingsState[K]) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      muted: false,
      reducedMotion: false,
      colourblind: 'none',
      fontScale: 1,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
    }),
    {
      name: 'fq:v1:settings',
      version: 1,
    },
  ),
);
