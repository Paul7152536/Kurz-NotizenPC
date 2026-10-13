const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
let win;
let pinned = true;

function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch (e) { return {}; }
}
function saveState() {
  if (!win) return;
  try {
    const b = win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, pinned }));
  } catch (e) {}
}

function createWindow() {
  const st = loadState();
  const wa = screen.getPrimaryDisplay().workArea;
  const w = st.width || 320, h = st.height || 460;
  const x = st.x !== undefined ? st.x : wa.x + wa.width - w - 12;
  const y = st.y !== undefined ? st.y : wa.y + 12;
  pinned = st.pinned !== false;

  win = new BrowserWindow({
    width: w, height: h, x, y,
    minWidth: 240, minHeight: 200,
    frame: false,
    alwaysOnTop: pinned,
    backgroundColor: '#ffffff',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.setMenu(null);
  win.loadFile('index.html');
  win.on('moved', saveState);
  win.on('resized', saveState);
  win.on('close', saveState);
}

app.whenReady().then(() => {
  const lock = app.requestSingleInstanceLock();
  if (!lock) { app.quit(); return; }
  app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });

  createWindow();

  // Strg+Alt+N: Fenster zeigen/fokussieren und neue Notiz anlegen
  globalShortcut.register('Control+Alt+N', () => {
    if (!win) return;
    win.show(); win.focus();
    win.webContents.send('new-note');
  });
  // Strg+Alt+K: Fenster ein-/ausblenden
  globalShortcut.register('Control+Alt+K', () => {
    if (!win) return;
    if (win.isVisible() && win.isFocused()) win.hide(); else { win.show(); win.focus(); }
  });

  ipcMain.handle('state', () => ({
    pinned,
    autostart: app.getLoginItemSettings().openAtLogin
  }));
  ipcMain.handle('toggle-pin', () => {
    pinned = !pinned;
    win.setAlwaysOnTop(pinned);
    saveState();
    return pinned;
  });
  ipcMain.handle('toggle-autostart', () => {
    const cur = app.getLoginItemSettings().openAtLogin;
    app.setLoginItemSettings({ openAtLogin: !cur, path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath });
    return !cur;
  });
  ipcMain.on('minimize', () => win.minimize());
  ipcMain.on('close', () => win.close());
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
