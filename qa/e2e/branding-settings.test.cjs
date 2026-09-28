'use strict';
const test=require('node:test');
const {expect}=require('../artisys-qa/node_modules/playwright/test');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');

async function login(page){
 await page.getByLabel('Usuário',{exact:true}).fill('admin');
 await page.getByLabel('Senha',{exact:true}).fill(process.env.LOCADORA_QA_ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.locator('.session')).toBeVisible();
}

test('aparencia: salva, recarrega e restaura GD sem apagar nome customizado',async()=>{
 const ctx=await launchLocadora();
 try{
  const p=ctx.page;await login(p);await p.locator('[data-nav="backup"]').click();
  await p.locator('#appearance-form [name="companyName"]').fill('George Rent');
  await p.locator('#appearance-form [name="slogan"]').fill('Mobilidade do seu jeito');
  await p.locator('#appearance-form [name="density"]').selectOption('compact');
  await p.locator('#appearance-form button.primary').click();
  await expect(p.locator('.toast').filter({hasText:'Aparência salva.'}).last()).toBeVisible();
  await expect(p.locator('.shell')).toHaveAttribute('data-density','compact');

  await p.reload();
  await expect(p.locator('.login-wrap')).toHaveAttribute('data-density','compact');
  await login(p);await p.locator('[data-nav="backup"]').click();
  await expect(p.locator('#appearance-form [name="companyName"]')).toHaveValue('George Rent');
  await expect(p.locator('#appearance-form [name="slogan"]')).toHaveValue('Mobilidade do seu jeito');
  await expect(p.locator('#appearance-form [name="density"]')).toHaveValue('compact');

  p.once('dialog',dialog=>dialog.dismiss());
  await p.locator('#appearance-reset').click();
  await expect(p.locator('.toast').filter({hasText:'Padrão GD restaurado.'}).last()).toBeVisible();
  await expect(p.locator('#appearance-form [name="companyName"]')).toHaveValue('George Rent');
  await expect(p.locator('#appearance-form [name="slogan"]')).toHaveValue('Liberdade para seu destino');
  await expect(p.locator('#appearance-form [name="density"]')).toHaveValue('comfortable');
 }finally{await ctx.close();}
});
