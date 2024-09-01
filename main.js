import { app, BrowserWindow, Menu, dialog, shell } from 'electron';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.logger.transports.console.level = 'info';
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    const menu = Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                { role: 'quit', label: '退出' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo', label: '撤销' },
                { role: 'redo', label: '重做' },
                { type: 'separator' },
                { role: 'cut', label: '剪切' },
                { role: 'copy', label: '复制' },
                { role: 'paste', label: '粘贴' },
                { role: 'selectAll', label: '全选' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        const appVersion = app.getVersion();
                        dialog.showMessageBox({
                            type: 'info',
                            title: '关于此应用',
                            message: `版本：${appVersion}\n谢谢关注。`,
                            detail: '联系方式：zzchun12826@gmail.com\n微信号：zzchun12826',
                            buttons: ['确定']
                        });
                    }
                },
                {
                    label: '检查更新',
                    click: () => {
                        autoUpdater.setFeedURL('https://mirror.ghproxy.com/https://github.com/jianzhichun/useflow-release/releases/latest/download/');
                        autoUpdater.checkForUpdates();
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);
    autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox({
            type: 'info',
            title: '更新可用',
            message: '有新版本可用，您现在要更新吗？',
            buttons: ['立即更新', '稍后'],
            defaultId: 0,
            cancelId: 1,
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();
            }
        })
    });
    autoUpdater.on('download-progress', (progressObj) => {
        const percent = Math.round(progressObj.percent);
        mainWindow.webContents.send('update-progress', { percent });
    });
    autoUpdater.on('update-downloaded', (info) => {
        dialog.showMessageBox({
            type: 'info',
            title: '更新安装包下载完成',
            message: '打开下载目录？',
            buttons: ['打开', '稍后'],
            defaultId: 0,
            cancelId: 1,
        }).then((result) => {
            if (result.response === 0) {
                const downloadDir = path.dirname(info.downloadedFile);
                shell.showItemInFolder(downloadDir);
            }
        })
    });
    autoUpdater.on('update-not-available', (info) => {
        dialog.showMessageBox({
            type: 'info',
            title: '没有可用更新',
            message: '当前版本已是最新版本。'
        });
    });
    autoUpdater.on('error', (err) => {
        log.error('更新错误:', err);
        // dialog.showErrorBox('更新错误', err == null ? "unknown" : (err.stack || err).toString());
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
