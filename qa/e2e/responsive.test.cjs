'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('../artisys-qa/node_modules/playwright/test');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');

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
   await window.locadoraDesktop.dbSet(key,JSON.stringify(snapshot));
 });
 await page.reload();
 await login(page);
}

async function assertViewport(page,width){
 await page.setViewportSize({width,height:800});
 await page.waitForTimeout(80);
 const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert.ok(metrics.scrollWidth<=metrics.innerWidth+1,`body vazou horizontalmente em ${width}px: ${metrics.scrollWidth}/${metrics.innerWidth}`);
 await expect(page.locator('.shell')).toBeVisible();
 if(width<=900){
  const box=await page.locator('.nav').first().boundingBox();
  assert.ok(box&&box.height>=40,`alvo touch da navegacao menor que 40px em ${width}px`);
 }
}

test('responsividade: shell e modal funcionam em 360, 768 e 1280 px',async()=>{
 const ctx=await launchLocadora();
 try{
  const p=ctx.page;await login(p);await seedRentalDependencies(p);
  for(const width of [360,768,1280])await assertViewport(p,width);
  await p.setViewportSize({width:360,height:800});
  await p.locator('[data-nav="reservas"]').click();
  await p.locator('#new-rental').click();
  const modal=await p.locator('.modal').boundingBox();
  assert.ok(modal&&modal.width<=360&&modal.height<=788,'modal deve caber na viewport estreita');
  await p.locator('[data-close]').first().click();
  await expect(p.locator('.modal-overlay')).toHaveCount(0);
 }finally{await ctx.close();}
});
