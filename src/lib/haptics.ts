export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  success: [20, 35, 20],
  warning: [30, 45, 30],
  error: [50, 40, 50, 40, 50],
};

export function triggerHaptic(type: HapticType, enabled = true) {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  navigator.vibrate(PATTERNS[type]);
}
