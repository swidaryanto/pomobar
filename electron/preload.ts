import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    updateTimer: (time: string) => ipcRenderer.send('update-timer', time),
    playFeedback: () => ipcRenderer.send('play-feedback'),
    quitApp: () => ipcRenderer.send('quit-app'),
});
