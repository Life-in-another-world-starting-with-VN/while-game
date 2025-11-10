export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}

export interface MenuItemProps {
  label: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export interface SettingsState {
  // 화면 설정
  screenMode: 'windowed' | 'fullscreen';

  // 넘기기 설정
  skipUnreadText: boolean;
  skipAfterChoice: boolean;
  skipScreenTransition: boolean;

  // 오디오 설정
  textSpeed: number;
  autoProgressTime: number;
  backgroundVolume: number;
  soundEffectVolume: number;
  voiceVolume: number;

  // 전체 음소거
  isMuted: boolean;

  // 캐릭터 설정
  characterSize: number; // 50~150 (percentage)
}

export type ColorToken = keyof typeof import('../styles/theme').colors;
export type TypographySize = keyof typeof import('../styles/theme').typography.sizes;

// Character expression types
export * from './character';

// v2 API types
export * from './api-v2';