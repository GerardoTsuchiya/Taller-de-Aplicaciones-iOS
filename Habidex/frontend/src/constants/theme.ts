export const Colors = {
  bg: '#08080f',
  bgPage: '#06060d',
  red: '#cc0000',
  redGlow: '#e63946',
  gold: '#ffd700',
  green: '#4ade80',
  textMain: '#c8c8d8',
  textSecondary: '#b0b0c4',
  textDisabled: '#666666',
  headerBg: '#110000',
  tabBg: '#080810',
  border: 'rgb(30, 48, 43)',
  borderActive: '#1a1a2e',
} as const;

export const Fonts = {
  pixel: 'PressStart2P_400Regular',
} as const;

export const FontSizes = {
  logo: 22,
  title: 17,
  label: 12,
  value: 19,
  small: 10,
  tiny: 9,
} as const;

export const Glow = {
  red: {
    textShadowColor: 'rgba(204, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  gold: {
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  green: {
    textShadowColor: 'rgba(74, 222, 128, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
} as const;

export const MIN_TOUCH = 44;
