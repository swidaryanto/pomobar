export {};

declare global {
  interface Window {
    electronAPI?: {
      updateTimer: (time: string) => void;
      playFeedback: () => void;
      quitApp: () => void;
      setTrayTheme: (theme: 'light' | 'dark') => void;
    };
  }
}
