const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('node:os');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { startSyncServer } = require('./sync-server.cjs');

let syncInfo=null;

async function getOrCreateToken(userData){
  const file=path.join(userData,'sync-config.json');
  try{const parsed=JSON.parse(await fs.readFile(file,'utf8'));if(parsed?.token)return parsed.token;}catch{}
  const token=crypto.randomBytes(12).toString('hex').toUpperCase();
  await fs.mkdir(userData,{recursive:true});
  await fs.writeFile(file,JSON.stringify({token},null,2),'utf8');
  return token;
}

function lanAddresses(){
  const values=[];
  for(const entries of Object.values(os.networkInterfaces()))for(const entry of entries||[])if(entry.family==='IPv4'&&!entry.internal)values.push(entry.address);
  return [...new Set(values)];
}

async function startLanSync(){
  const userData=app.getPath('userData');
  const token=await getOrCreateToken(userData);
  const rootDir=app.getAppPath();
  const stateFile=path.join(userData,'sync-state.json');
  let server;
  try{server=await startSyncServer({host:'0.0.0.0',port:4174,token,rootDir,stateFile});}
  catch(error){if(error?.code!=='EADDRINUSE')throw error;server=await startSyncServer({host:'0.0.0.0',port:0,token,rootDir,stateFile});}
  const urls=lanAddresses().map(address=>`http://${address}:${server.port}`);
  syncInfo={available:true,port:server.port,token,localUrl:`http://127.0.0.1:${server.port}`,urls,pairingUrls:urls.map(url=>`${url}/?pair=${encodeURIComponent(token)}`)};
  app.once('before-quit',()=>{void server.close();});
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    autoHideMenuBar: true,
    webPreferences: {
      preload:path.join(__dirname,'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(async () => {
  await startLanSync();
  ipcMain.handle('locadora:sync-info',()=>syncInfo);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
