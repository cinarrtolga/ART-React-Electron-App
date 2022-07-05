const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require("electron-updater");
const fs = require('fs');
const data = fs.readFileSync(__dirname + '/../package.json', 'utf8');
const dataObj = JSON.parse(data);

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

autoUpdater.on("checking-for-update", (_event) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `${autoUpdater.channel} Update Checking!`,
        message: "A message!",
        detail: `A new ${autoUpdater.channel} version check started.`
    };
    dialog.showMessageBox(dialogOpts);
    updateInterval = null;
});

autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `${autoUpdater.channel} Update Available`,
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: `A new ${autoUpdater.channel} version download started. The app will be restarted to install the update.`
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

autoUpdater.on("update-not-available", (_event) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Ok'],
        title: `${autoUpdater.channel} Update Not available`,
        message: "A message!",
        detail: `A new ${autoUpdater.channel} version not available.`
    };
    dialog.showMessageBox(dialogOpts);
    updateInterval = null;
});
