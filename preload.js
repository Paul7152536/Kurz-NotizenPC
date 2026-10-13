const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kn', {
  state: () => ipcRenderer.invoke('state'),
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  toggleAutostart: () => ipcRenderer.invoke('toggle-autostart'),
  minimize: () => ipcRenderer.send('minimize'),
  close: () => ipcRenderer.send('close'),
  onNew: (cb) => ipcRenderer.on('new-note', cb)
});
