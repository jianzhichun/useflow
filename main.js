import { app, BrowserWindow, Menu, dialog } from 'electron';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    Menu.setApplicationMenu(Menu.buildFromTemplate([
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
                        autoUpdater.checkForUpdates();
                    }
                }
            ]
        }
    ]));
    autoUpdater.on('update-available', (info) => {
        autoUpdater.downloadUpdate();
        dialog.showMessageBox({
            type: 'info',
            title: '更新可用',
            message: '有新版本可用，正在下载...'
        });
    });
    autoUpdater.on('update-downloaded', (info) => {
        dialog.showMessageBox({
            type: 'info',
            title: '更新下载完成',
            message: '更新已下载完成，应用程序将重启以应用更新。'
        }).then(() => {
            autoUpdater.quitAndInstall();
        });
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
        dialog.showErrorBox('更新错误', err == null ? "unknown" : (err.stack || err).toString());
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
