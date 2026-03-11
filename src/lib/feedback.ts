export type FeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const PATTERNS: Record<FeedbackType, { durationMs: number; frequency: number; gain: number }> = {
  light: { durationMs: 80, frequency: 520, gain: 0.08 },
  medium: { durationMs: 120, frequency: 440, gain: 0.1 },
  heavy: { durationMs: 160, frequency: 360, gain: 0.12 },
  success: { durationMs: 180, frequency: 600, gain: 0.1 },
  warning: { durationMs: 200, frequency: 300, gain: 0.12 },
  error: { durationMs: 220, frequency: 220, gain: 0.14 },
};

let audioContext: AudioContext | null = null;
let fallbackAudio: HTMLAudioElement | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Context =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof win.webkitAudioContext !== 'undefined'
        ? win.webkitAudioContext
        : null;

  if (!Context) {
    return null;
  }

  if (!audioContext) {
    audioContext = new Context();
  }

  return audioContext;
};

const playOnce = (context: AudioContext, type: FeedbackType) => {
  const { durationMs, frequency, gain } = PATTERNS[type];
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gain;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  const now = context.currentTime;
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
};

const getFallbackAudio = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!fallbackAudio) {
    fallbackAudio = new Audio();
    fallbackAudio.preload = 'auto';
  }

  return fallbackAudio;
};

const playFallbackTone = async (type: FeedbackType) => {
  const audio = getFallbackAudio();
  if (!audio) {
    return false;
  }

  const { frequency, durationMs } = PATTERNS[type];
  const sampleRate = 44100;
  const frameCount = Math.round(sampleRate * (durationMs / 1000));
  const buffer = new ArrayBuffer(44 + frameCount * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + frameCount * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, frameCount * 2, true);

  const amplitude = 0.2;
  for (let i = 0; i < frameCount; i += 1) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    view.setInt16(44 + i * 2, sample * amplitude * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  audio.src = url;
  audio.currentTime = 0;

  try {
    await audio.play();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    URL.revokeObjectURL(url);
    return false;
  }
};

export const playFeedbackTone = (type: FeedbackType, enabled = true) => {
  if (!enabled) {
    return false;
  }

  const context = getAudioContext();
  if (!context) {
    return false;
  }

  try {
    if (context.state === 'suspended') {
      context
        .resume()
        .then(() => playOnce(context, type))
        .catch(() => {});
      return true;
    }

    playOnce(context, type);

    return true;
  } catch {
    return false;
  }
};

export const getFeedbackState = () => {
  const context = getAudioContext();
  if (!context) {
    return 'unavailable' as const;
  }

  return context.state;
};

export const testFeedbackTone = async () => {
  const context = getAudioContext();
  if (!context) {
    const fallbackOk = await playFallbackTone('medium');
    return fallbackOk
      ? { ok: true as const }
      : { ok: false, reason: 'unavailable' as const };
  }

  try {
    if (context.state === 'suspended') {
      await context.resume();
    }

    playOnce(context, 'medium');
    return { ok: true as const };
  } catch {
    const fallbackOk = await playFallbackTone('medium');
    return fallbackOk
      ? { ok: true as const }
      : { ok: false, reason: 'blocked' as const };
  }
};
