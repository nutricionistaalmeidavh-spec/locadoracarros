'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {createReadStream,existsSync,mkdirSync,rmSync,statSync}=require('node:fs');
const {resolve,extname,join,normalize}=require('node:path');
const {chromium}=require('../artisys-qa/node_modules/playwright');
const {expect}=require('../artisys-qa/node_modules/playwright/test');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');

const ROOT=resolve(__dirname,'..','..');
const OUT=resolve(ROOT,'qa-artifacts','screen-catalog');
const SCREENS=[
  ['dashboard','Dashboard'],['reservas','Reservas'],['clientes','Clientes'],['frota','Frota'],
  ['vistorias','Vistorias'],['manutencao','Manutenção'],['financeiro','Financeiro'],['cobrancas','Cobranças'],
  ['inadimplencia','Inadimplência'],['contratos','Contratos'],['alertas','Alertas'],['documentos','Documentos'],
  ['sync','PC ↔ Mobile'],['auditoria','Auditoria'],['backup','Backup / Aparência']
];
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.wasm':'application/wasm'};

function safePath(url){
  const pathname=decodeURIComponent(new URL(url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=normalize(resolve(ROOT,rel));
  return file.startsWith(ROOT)?file:null;
}

async function startStaticServer(){
  const server=http.createServer((req,res)=>{
    const file=safePath(req.url||'/');
    if(!file||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    createReadStream(file).pipe(res);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const address=server.address();
  return{url:`http://127.0.0.1:${address.port}/`,close:()=>new Promise(resolve=>server.close(resolve))};
}

async function login(page){
  await expect(page.getByLabel('Usuário',{exact:true})).toBeVisible({timeout:30000});
  await page.getByLabel('Usuário',{exact:true}).fill('admin');
  await page.getByLabel('Senha',{exact:true}).fill(process.env.LOCADORA_QA_ADMIN_PASSWORD||'1234');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.locator('.session')).toBeVisible({timeout:30000});
}

async function captureScreens(page,outDir,{fullPage=true}={}){
  mkdirSync(outDir,{recursive:true});
  await page.screenshot({path:join(outDir,'00-login.png'),fullPage});
  await login(page);
  let index=1;
  for(const [id] of SCREENS){
    const nav=page.locator(`[data-nav="${id}"]`);
    await expect(nav).toBeVisible();
    await nav.click();
    await expect(page.locator(`[data-screen="${id}"]`)).toBeVisible();
    await page.waitForTimeout(80);
    await page.screenshot({path:join(outDir,`${String(index).padStart(2,'0')}-${id}.png`),fullPage});
    index+=1;
  }
}

test('catálogo visual: captura todas as telas online e desktop',async()=>{
  rmSync(OUT,{recursive:true,force:true});mkdirSync(OUT,{recursive:true});

  const server=await startStaticServer();
  let browser;
  try{
    const candidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
    const executablePath=candidates.find(existsSync);
    browser=await chromium.launch({headless:true,executablePath:executablePath||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    await context.addInitScript(()=>{
      const memory=new Map();
      Object.defineProperty(window,'locadoraDesktop',{configurable:true,value:{
        dbGet:async key=>memory.get(String(key))??null,
        dbSet:async(key,value)=>{memory.set(String(key),String(value));return true;},
        dbRemove:async key=>{memory.delete(String(key));return true;},
        getSyncInfo:async()=>({available:false})
      }});
    });
    const page=await context.newPage();
    const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(server.url,{waitUntil:'domcontentloaded',timeout:30000});
    await captureScreens(page,join(OUT,'online'),{fullPage:true});
    assert.deepEqual(pageErrors,[],'versão online não deve gerar exceções durante o catálogo');
    await context.close();
  }finally{
    await browser?.close();
    await server.close();
  }

  const desktop=await launchLocadora();
  try{
    await desktop.page.setViewportSize({width:1440,height:900});
    await captureScreens(desktop.page,join(OUT,'desktop'),{fullPage:true});
  }finally{await desktop.close();}

  for(const mode of ['online','desktop']){
    const expected=1+SCREENS.length;
    const {readdirSync}=require('node:fs');
    assert.equal(readdirSync(join(OUT,mode)).filter(name=>name.endsWith('.png')).length,expected,`${mode} deve ter ${expected} screenshots`);
  }
});
