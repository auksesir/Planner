const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electron', {
    appVersion: process.env.npm_package_version,
    platform: process.platform,
    // Add API for communicating with backend
    api: {
      fetch: (url, options) => fetch(url, options).then(res => res.json())
    }
  }
);