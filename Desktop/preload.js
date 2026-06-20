const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  silentPrint: (htmlContent, printerName) => ipcRenderer.send('silent-print', { htmlContent, printerName })
});
