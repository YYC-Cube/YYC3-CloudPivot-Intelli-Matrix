import { contextBridge, shell } from 'electron';
contextBridge.exposeInMainWorld('yyc3', {
    openExternal: (url) => shell.openExternal(url),
    openPath: (path) => shell.openPath(path),
    showItemInFolder: (path) => shell.showItemInFolder(path),
    openFileEditor: (path) => shell.openExternal(`file://${path}`),
    getVersion: () => process.versions.electron,
    getPlatform: () => process.platform,
    isDev: () => process.env.NODE_ENV === 'development',
});
//# sourceMappingURL=preload.js.map