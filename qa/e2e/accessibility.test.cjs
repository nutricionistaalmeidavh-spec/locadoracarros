'use strict';
const test=require('node:test');
const {expect}=require('../artisys-qa/node_modules/playwright/test');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');

async function loginWithKeyboard(page){
  const user=page.getByLabel('Usuário',{exact:true});
  await user.focus();
  await user.fill('admin');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Senha',{exact:true})).toBeFocused();
  await page.getByLabel('Senha',{exact:true}).fill(process.env.LOCADORA_QA_ADMIN_PASSWORD);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Entrar',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.session')).toBeVisible();
}

test('acessibilidade: login, navegacao e modal possuem semantica operavel por teclado',async()=>{
  const ctx=await launchLocadora();
  try{
    const p=ctx.page;
    await expect(p.locator('#login-error')).toHaveAttribute('role','alert');
    await loginWithKeyboard(p);
    const dashboard=p.locator('[data-nav="dashboard"]');
    await expect(dashboard).toHaveAttribute('aria-current','page');
    await expect(p.getByRole('navigation',{name:'Navegação principal'})).toBeVisible();

    await p.locator('[data-nav="manutencao"]').click();
    await p.locator('#new-maintenance').click();
    const dialog=p.getByRole('dialog',{name:'Agendar manutenção'});
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button',{name:'Fechar'})).toBeFocused();
    await p.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }finally{await ctx.close();}
});
