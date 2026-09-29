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

async function nav(page,id){
 await page.locator(`[data-nav="${id}"]`).click();
 await expect(page.locator(`[data-screen="${id}"]`)).toBeVisible();
}

test('fase 17: smoke final percorre cadastro, locacao, financeiro, documentos, aparencia, backup e sync',async()=>{
 const ctx=await launchLocadora();
 const errors=[];ctx.page.on('pageerror',error=>errors.push(error.message));
 try{
  const p=ctx.page;await login(p);

  await nav(p,'clientes');
  await p.locator('#new-customer').click();
  await p.locator('#customer-form [name="name"]').fill('Cliente Release QA');
  await p.locator('#customer-form [name="document"]').fill('12345678900');
  await p.locator('#customer-form [name="phone"]').fill('16999999999');
  await p.locator('#customer-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'Cliente cadastrado.'}).last()).toBeVisible();
  await expect(p.getByText('Cliente Release QA',{exact:true})).toBeVisible();
  await p.locator('[data-license]').first().click();
  await p.locator('#license-form [name="number"]').fill('QA123456');
  await p.locator('#license-form [name="category"]').fill('B');
  await p.locator('#license-form [name="expiry"]').fill('2030-12-31');
  await p.locator('#license-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'CNH atualizada.'}).last()).toBeVisible();

  await nav(p,'frota');
  await p.locator('#new-vehicle').click();
  await p.locator('#vehicle-form [name="model"]').fill('Onix Release QA');
  await p.locator('#vehicle-form [name="plate"]').fill('QA1B234');
  await p.locator('#vehicle-form [name="year"]').fill('2026');
  await p.locator('#vehicle-form [name="dailyRate"]').fill('150');
  await p.locator('#vehicle-form [name="mileage"]').fill('1000');
  await p.locator('#vehicle-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'Veículo cadastrado.'}).last()).toBeVisible();
  await expect(p.getByText('Onix Release QA',{exact:true})).toBeVisible();
  await p.locator('[data-docs]').first().click();
  await p.locator('#vehicle-docs-form [name="insuranceExpiry"]').fill('2030-12-31');
  await p.locator('#vehicle-docs-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'Documentos atualizados.'}).last()).toBeVisible();

  await nav(p,'reservas');
  await p.locator('#new-rental').click();
  const pickup='2026-10-20T10:00',returnAt='2026-10-22T10:00';
  await p.locator('#rental-form [name="pickupAt"]').fill(pickup);
  await p.locator('#rental-form [name="returnAt"]').fill(returnAt);
  await p.locator('#rental-form [name="dailyRate"]').fill('150');
  await p.locator('#rental-form [name="billingMode"]').selectOption('total');
  await p.locator('#rental-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'Reserva criada.'}).last()).toBeVisible();
  await expect(p.locator('tbody').getByText('Cliente Release QA').first()).toBeVisible();

  await nav(p,'financeiro');
  const expenseButton=p.locator('#new-expense');
  await expenseButton.focus();await expenseButton.click();
  await expect(p.getByRole('dialog',{name:'Nova despesa'})).toBeVisible();
  await p.keyboard.press('Escape');
  await expect(p.locator('.modal-overlay')).toHaveCount(0);
  await expect(expenseButton).toBeFocused();
  await expenseButton.click();
  await p.locator('#expense-form [name="description"]').fill('Lavagem QA');
  await p.locator('#expense-form [name="category"]').fill('Operacional');
  await p.locator('#expense-form [name="amount"]').fill('50');
  await p.locator('#expense-form [name="dueAt"]').fill('2026-10-20');
  await p.locator('#expense-form .primary').click();
  await expect(p.locator('.toast').filter({hasText:'Despesa registrada.'}).last()).toBeVisible();

  await nav(p,'documentos');
  assert.ok((await p.locator('#view').innerText()).trim().length>0);
  await nav(p,'contratos');
  assert.ok((await p.locator('#view').innerText()).trim().length>0);

  await nav(p,'backup');
  await expect(p.locator('#backup-create')).toBeVisible();
  await p.locator('#appearance-form [name="slogan"]').fill('Release QA GD');
  await p.locator('#appearance-form [name="density"]').selectOption('compact');
  await p.locator('#appearance-form button.primary').click();
  await expect(p.locator('.toast').filter({hasText:'Aparência salva.'}).last()).toBeVisible();
  await expect(p.locator('.shell')).toHaveAttribute('data-density','compact');

  await p.reload();await expect(p.locator('.login-wrap')).toHaveAttribute('data-density','compact');await login(p);
  await nav(p,'backup');
  await expect(p.locator('#appearance-form [name="slogan"]')).toHaveValue('Release QA GD');
  await expect(p.locator('#appearance-form [name="density"]')).toHaveValue('compact');
  await expect(p.locator('#backup-create')).toBeVisible();

  await nav(p,'sync');
  assert.ok((await p.locator('#view').innerText()).trim().length>0,'PC ↔ Mobile deve renderizar mesmo sem ação manual de sync');

  await p.locator('#logout').click();
  await expect(p.locator('#login')).toBeVisible();
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
});
