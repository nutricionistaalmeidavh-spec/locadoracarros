'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('../artisys-qa/node_modules/playwright/test');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');

const ADMIN_SCREENS=[
 'dashboard','reservas','clientes','frota','vistorias','manutencao',
 'financeiro','cobrancas','inadimplencia','contratos','alertas',
 'documentos','sync','auditoria','backup'
];

async function login(page){
 await page.getByLabel('Usuário',{exact:true}).fill('admin');
 await page.getByLabel('Senha',{exact:true}).fill(process.env.LOCADORA_QA_ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.locator('.session')).toBeVisible();
}

async function seedRentalDependencies(page){
 await page.evaluate(async()=>{
   const key='app:snapshot:v3',snapshot=JSON.parse(await window.locadoraDesktop.dbGet(key));
   snapshot.customers=[{id:'CLI-QA-RESP',name:'Cliente QA',document:'12345678900',phone:'',email:'',address:'',active:true,driverLicense:{number:'',category:'',expiry:''}}];
   snapshot.vehicles=[{id:'VEI-QA-RESP',model:'Onix QA',plate:'QA12345',year:2026,color:'Prata',dailyRate:100,mileage:1000,availability:'disponivel',active:true,documents:{insuranceExpiry:'',licensingExpiry:'',inspectionExpiry:'',renavam:'',chassis:''}}];
   snapshot.settings={...snapshot.settings,branding:{...(snapshot.settings?.branding||{}),preset:'gd',logoVariant:'gd',slogan:'Liberdade para seu destino',density:'comfortable'}};
   await window.locadoraDesktop.dbSet(key,JSON.stringify(snapshot));
 });
 await page.reload();
 await login(page);
}

async function assertNoBodyOverflow(page,width,screen){
 const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert.ok(metrics.scrollWidth<=metrics.innerWidth+1,`${screen} vazou horizontalmente em ${width}px: ${metrics.scrollWidth}/${metrics.innerWidth}`);
}

async function assertCompactMobileShell(page,width,screen){
 const sidebar=await page.locator('.sidebar').boundingBox();
 const main=await page.locator('.shell main').boundingBox();
 assert.ok(sidebar&&sidebar.height<=80,`${screen}: navegação mobile consumiu ${sidebar?.height}px de altura em ${width}px`);
 assert.ok(main&&sidebar&&Math.abs(main.y-(sidebar.y+sidebar.height))<=2,`${screen}: conteúdo não começa imediatamente após a navegação mobile`);
}

async function assertScreenMatrix(page,width){
 await page.setViewportSize({width,height:800});
 for(const screen of ADMIN_SCREENS){
  const nav=page.locator(`[data-nav="${screen}"]`);
  await expect(nav).toBeVisible();
  await nav.click();
  await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible();
  await expect(page.locator('#view')).toBeVisible();
  await assertNoBodyOverflow(page,width,screen);
  if(width<=900)await assertCompactMobileShell(page,width,screen);
 }
 const firstNav=page.locator('.nav').first();
 if(width<=900){
  const box=await firstNav.boundingBox();
  assert.ok(box&&box.height>=40,`alvo touch da navegacao menor que 40px em ${width}px`);
 }
}

async function setCompactDensity(page){
 await page.evaluate(async()=>{
   const key='app:snapshot:v3',snapshot=JSON.parse(await window.locadoraDesktop.dbGet(key));
   snapshot.settings={...snapshot.settings,branding:{...(snapshot.settings?.branding||{}),preset:'gd',logoVariant:'gd',slogan:'Liberdade para seu destino',density:'compact'}};
   await window.locadoraDesktop.dbSet(key,JSON.stringify(snapshot));
 });
 await page.reload();
 await login(page);
 await expect(page.locator('.shell')).toHaveAttribute('data-density','compact');
}

test('responsividade: todas as telas administrativas cabem em 360, 768 e 1280 px',async()=>{
 const ctx=await launchLocadora();
 try{
  const p=ctx.page;await login(p);await seedRentalDependencies(p);
  for(const width of [360,768,1280])await assertScreenMatrix(p,width);
 }finally{await ctx.close();}
});

test('responsividade: densidade compacta preserva telas e modal na viewport estreita',async()=>{
 const ctx=await launchLocadora();
 try{
  const p=ctx.page;await login(p);await seedRentalDependencies(p);await setCompactDensity(p);
  await assertScreenMatrix(p,360);
  await p.locator('[data-nav="reservas"]').click();
  await p.locator('#new-rental').click();
  const modal=await p.locator('.modal').boundingBox();
  assert.ok(modal&&modal.width<=360&&modal.height<=788,'modal deve caber na viewport estreita em densidade compacta');
  await p.locator('[data-close]').first().click();
  await expect(p.locator('.modal-overlay')).toHaveCount(0);
 }finally{await ctx.close();}
});
