const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require("electron-updater");

let updateInterval = null;

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
    autoUpdater.channel = process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING || 'latest';
    updateInterval = setInterval(() => autoUpdater.checkForUpdates(), 10000);

    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `The selected app channel is ${process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING}`,
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: `A new ${process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING} / ${process.env.REACT_APP_ENV_UPDATE_CHANNEL_SUFFIX} version download started. The app will be restarted to install the update.`
    };
    dialog.showMessageBox(dialogOpts);
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
        title: `${process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING} Update Available`,
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: `A new ${process.env.REACT_APP_ENV_UPDATE_CHANNEL_STRING} version download started. The app will be restarted to install the update.`
    };
    dialog.showMessageBox(dialogOpts);
    updateInterval = null;
});

autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
});
