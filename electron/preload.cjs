const { contextBridge, ipcRenderer }=require('electron');
contextBridge.exposeInMainWorld('locadoraDesktop',{getSyncInfo:()=>ipcRenderer.invoke('locadora:sync-info')});
