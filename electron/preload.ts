import { contextBridge, shell } from 'electron';

contextBridge.exposeInMainWorld('yyc3', {
  openExternal: (url: string) => shell.openExternal(url),
  openPath: (path: string) => shell.openPath(path),
  showItemInFolder: (path: string) => shell.showItemInFolder(path),
  openFileEditor: (path: string) => shell.openExternal(`file://${path}`),
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
  isDev: () => process.env.NODE_ENV === 'development',
});
