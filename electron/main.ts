/**
 * electron/main.ts
 * ================
 * YYC³ CloudPivot Intelli-Matrix · Electron 主进程（ESM）
 *
 * 构建说明:
 * - 由 vite-plugin-electron 在 `vite build` 时编译输出至根目录 `dist-electron/main.js`（ESM）
 * - package.json `main` 字段指向 dist-electron/main.js
 * - __dirname 等价物使用 import.meta.dirname（Node 20.11+ / Electron 41 内置 Node 满足）
 *
 * 安全基线: contextIsolation=true / nodeIntegration=false / sandbox=false（preload 依赖
 * shell 主进程模块，沙箱内不可用；preload 输出为 .cjs 无 ESM 歧义）
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isMac = process.platform === 'darwin';
const isDev = !app.isPackaged;

/** 资源目录: 打包后 public/ 映射到 resources/，开发期直接读 public/ */
const resourcesDir = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(import.meta.dirname, '../public');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'YYC³ CloudPivot Intelli-Matrix',
    icon: path.join(resourcesDir, 'icons/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(import.meta.dirname, 'preload.cjs'),
    },
    backgroundColor: '#060e1f',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 12, y: 12 },
  });

  if (isDev) {
    // 开发模式: electron:dev 先起 Vite dev server，再加载开发 URL
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:3218');
  } else {
    mainWindow.loadFile(path.join(import.meta.dirname, '../dist/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('http:') || details.url.startsWith('https:')) {
      shell.openExternal(details.url);
    }
    // 非 http(s) 一律拦截，禁止新窗口打开
    return { action: 'deny' };
  });
}

function createTray() {
  try {
    const trayIconPath = path.join(resourcesDir, 'icons/icon-512.png');
    const trayIcon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });

    tray = new Tray(trayIcon);
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: '重启应用',
        click: () => {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: '检查更新',
        click: async () => {
          if (mainWindow) {
            dialog.showMessageBox(mainWindow, {
              title: '检查更新',
              message: `当前版本: v${app.getVersion()}`,
              detail: '自动更新通道配置中，请暂访问 GitHub 查看最新版本',
              buttons: ['确定'],
            });
          }
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]));

    tray.setIgnoreDoubleClickEvents(true);
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    // 托盘图标缺失不应阻断应用启动
    console.error('[YYC³] 托盘初始化失败:', error);
  }
}

function init() {
  if (app.requestSingleInstanceLock()) {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      createWindow();
      createTray();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (!isMac) {
        app.quit();
      }
    });
  } else {
    app.quit();
  }
}

init();
