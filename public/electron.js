const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require("electron-updater");
const fs = require('fs');
const data = fs.readFileSync(__dirname + '/../package.json', 'utf8');
const dataObj = JSON.parse(data);

let updateInterval = null;
let updateCheck = false;
let updateFound = false;
let updateNotAvailable = false;

function createWindow() {
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true,
    });
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if (process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING === 'dev') {
        win.loadURL(startUrl);
    } else {
        win.loadURL('file:///' + __dirname + "/index.html");
    }

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    if (dataObj.version.includes("-alpha")) {
        autoUpdater.channel = "alpha";
    } else if (dataObj.version.includes("-beta")) {
        autoUpdater.channel = "beta";
    } else {
        autoUpdater.channel = "latest";
    }

    updateInterval = setInterval(() => autoUpdater.checkForUpdates(), 10000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
});

autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `${autoUpdater.channel} Update Available`,
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: `A new ${autoUpdater.channel} version download started.`
    };

    if (!updateCheck) {
        updateInterval = null;
        dialog.showMessageBox(dialogOpts);
        updateCheck = true;
    }
});

autoUpdater.on("update-downloaded", (_event) => {
    if (!updateFound) {
        updateInterval = null;
        updateFound = true;
        setImmediate(() => {
            app.removeAllListeners("window-all-closed")
            autoUpdater.quitAndInstall(false)
        });
    }
});

autoUpdater.on("update-not-available", (_event) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `Update Not available for ${autoUpdater.channel}`,
        message: "A message!",
        detail: `Update Not available for ${autoUpdater.channel}`
    };

    if (!updateNotAvailable) {
        updateNotAvailable = true;
        dialog.showMessageBox(dialogOpts);
    }
});
