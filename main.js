const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');

function getStableDeviceId() {
    try {
        // جلب المعرف الخام من الجهاز
        const rawId = machineIdSync({ original: true });
        
        // تحويل إلى MD5 hash → 32 حرف hex
        const hash = crypto.createHash('md5').update(rawId).digest('hex').toUpperCase();
        
        // تحويله لشكل UUID مألوف (مثل 8-4-4-4-12)
        return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
    } catch (err) {
        console.error('فشل جلب معرف الجهاز:', err);
        return 'FALLBACK-' + Date.now().toString(36).toUpperCase();
    }
}

// احسب الـ ID مرة واحدة فقط
const deviceId = getStableDeviceId();

console.log('Device ID (main process):', deviceId);

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'dist/1.ico'),
        webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')   // ← أهم سطر
}
    });

    win.setMenu(null);

    // IPC لإرجاع الـ device ID للـ renderer
    ipcMain.handle('get-machine-id', async () => {
        return deviceId;
    });

    // تحميل الـ React app
    win.loadFile(path.join(__dirname, 'dist/index.html'));

    // اختياري: فتح DevTools في وضع التطوير
    // if (!app.isPackaged) win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});