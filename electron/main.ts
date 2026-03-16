import { app, BrowserWindow, Tray, ipcMain, nativeImage, Menu, shell, screen } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayTheme: 'light' | 'dark' = 'dark';

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

const loadTrayIcon = (theme: 'light' | 'dark') => {
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
    const size = scaleFactor >= 3 ? 64 : scaleFactor >= 2 ? 32 : 16;
    const filename = `tray-${theme}-${size}.svg`;
    const svgPath = path.join(app.getAppPath(), 'electron', 'assets', filename);

    try {
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        return nativeImage
            .createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`)
            .resize({ width: size, height: size });
    } catch {
        return nativeImage
            .createFromDataURL(
                `data:image/svg+xml;base64,${Buffer.from(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="2" width="10" height="12" rx="2" fill="#111111"/><rect x="5" y="4" width="6" height="6" rx="1" fill="#f5f5f5"/></svg>'
                ).toString('base64')}`
            )
            .resize({ width: 16, height: 16 });
    }
};

const applyTrayIcon = () => {
    if (!tray) {
        return;
    }
    const icon = loadTrayIcon(trayTheme);
    tray.setImage(icon);
};

const createTray = () => {
    const icon = loadTrayIcon(trayTheme);

    tray = new Tray(icon);
    tray.setTitle('Pomobar');
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
            const { width, height } = mainWindow.getBounds();
            const targetX = Math.round(x + trayWidth / 2 - width / 2);
            const targetY = Math.round(y + trayHeight);
            const display = screen.getDisplayNearestPoint({ x, y });
            const { x: dx, y: dy, width: dw, height: dh } = display.workArea;
            const clampedX = Math.min(Math.max(targetX, dx), dx + dw - width);
            const clampedY = Math.min(Math.max(targetY, dy), dy + dh - height);

            mainWindow.setPosition(clampedX, clampedY, false);
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

ipcMain.on('set-tray-theme', (_, theme: 'light' | 'dark') => {
    trayTheme = theme;
    applyTrayIcon();
});
