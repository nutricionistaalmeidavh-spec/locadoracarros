'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {launchLocadora}=require('./fixtures/locadora-electron.cjs');
const password=process.env.LOCADORA_QA_ADMIN_PASSWORD;

async function login(page){
  assert.ok(password,'LOCADORA_QA_ADMIN_PASSWORD is required');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button',{name:'Entrar'}).click();
  await page.locator('.session').getByText('Administrador').waitFor();
}

async function createCustomer(page){
  await page.locator('[data-nav="clientes"]').click();
  await page.locator('#new-customer').click();
  const form=page.locator('#customer-form');
  await form.locator('[name="name"]').fill('George E2E');
  await form.locator('[name="document"]').fill('12345678900');
  await form.locator('[name="phone"]').fill('16999999999');
  await form.getByRole('button',{name:'Salvar'}).click();
  await page.getByText('George E2E').waitFor();
}

async function createVehicle(page){
  await page.locator('[data-nav="frota"]').click();
  await page.locator('#new-vehicle').click();
  const form=page.locator('#vehicle-form');
  await form.locator('[name="model"]').fill('Onix E2E');
  await form.locator('[name="plate"]').fill('E2E1A23');
  await form.locator('[name="year"]').fill('2026');
  await form.locator('[name="category"]').fill('Compacto');
  await form.locator('[name="dailyRate"]').fill('100');
  await form.getByRole('button',{name:'Salvar'}).click();
  await page.getByText('Onix E2E').waitFor();
}

test('Electron: reserva por diária gera cinco cobranças e recebe a próxima',async()=>{
  const ctx=await launchLocadora();
  try{
    const page=ctx.page;
    await login(page);
    await createCustomer(page);
    await createVehicle(page);

    await page.locator('[data-nav="reservas"]').click();
    await page.locator('#new-rental').click();
    const form=page.locator('#rental-form');
    await form.locator('[name="pickupAt"]').fill('2026-10-01T10:00');
    await form.locator('[name="returnAt"]').fill('2026-10-06T10:00');
    await form.locator('[name="billingMode"]').selectOption('daily');
    assert.equal(await form.locator('[name="dailyRate"]').inputValue(),'100');
    await form.getByRole('button',{name:'Salvar reserva'}).click();

    const dailyButton=page.locator('[data-daily-control]').first();
    await dailyButton.waitFor();
    await dailyButton.click();
    await page.getByRole('heading',{name:'Controle de diárias'}).waitFor();
    assert.equal(await page.locator('.modal tbody tr').count(),5);
    await page.getByText('Diária 1', {exact:false}).waitFor();
    await page.locator('#receive-next-daily').click();

    await page.getByRole('heading',{name:'Receber diária'}).waitFor();
    assert.equal(await page.locator('.modal-overlay').count(),1,'recebimento deve substituir o modal anterior');
    const payment=page.locator('#daily-payment-form');
    assert.equal(await payment.locator('[name="amount"]').inputValue(),'100.00');
    await payment.getByRole('button',{name:'Confirmar recebimento'}).click();
    await page.getByText('Diária atualizada.').waitFor();

    await page.locator('[data-daily-control]').first().click();
    await page.getByRole('heading',{name:'Controle de diárias'}).waitFor();
    await page.locator('.modal tbody tr').first().getByText('Pago').waitFor();
    await page.getByText('Diária 2', {exact:false}).waitFor();
    const received=await page.locator('.modal .cards article').filter({hasText:'Recebido'}).innerText();
    assert.match(received,/100,00/);
  } finally {
    await ctx.close();
  }
});
