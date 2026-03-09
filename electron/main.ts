import { app, BrowserWindow, Tray, ipcMain, nativeImage, Menu, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 480,
        show: false,
        frame: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('blur', () => {
        mainWindow?.hide();
    });
};

const createTray = () => {
    const icon = nativeImage.createEmpty();
    icon.resize({ width: 16, height: 16 });

    tray = new Tray(icon);
    tray.setTitle('No | 25:00');
    tray.setToolTip('Pomobar');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);

    tray.on('right-click', () => {
        tray?.popUpContextMenu(contextMenu);
    });

    tray.on('click', (event, bounds) => {
        if (!mainWindow) return;

        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            const trayBounds = tray?.getBounds() || bounds;
            const { x, y, width: trayWidth, height: trayHeight } = trayBounds;
            const { width } = mainWindow.getBounds();

            const px = Math.round(x + trayWidth / 2 - width / 2);
            const py = Math.round(y + trayHeight);

            mainWindow.setPosition(px, py, false);
            mainWindow.show();
            mainWindow.focus();
        }
    });
};

app.whenReady().then(() => {
    if (app.dock) {
        app.dock.hide();
    }
    createMainWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('update-timer', (_, timeString) => {
    if (tray) {
        tray.setTitle(timeString);
    }
});

ipcMain.on('play-feedback', () => {
    shell.beep();
});

ipcMain.on('quit-app', () => {
    app.quit();
});
