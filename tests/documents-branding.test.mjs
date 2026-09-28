import test from 'node:test';
import assert from 'node:assert/strict';
import { rentalContractPdf,rentalReceiptPdf,dailyPaymentReceiptPdf,inspectionPdf,issuedContractPdf } from '../src/domain/documents.mjs';

const decode=(bytes)=>new TextDecoder().decode(bytes);

function snapshot(){return{
  settings:{companyName:'George Rent',document:'12.345.678/0001-90',branding:{slogan:'Mobilidade do seu jeito',density:'compact'}},
  customers:[{id:'CLI-1',name:'Ana',document:'123'}],
  vehicles:[{id:'VEI-1',model:'Onix',plate:'ABC1D23'}],
  rentals:[{id:'LOC-1',customerId:'CLI-1',vehicleId:'VEI-1',pickupAt:'2026-09-28T10:00:00Z',returnAt:'2026-09-29T10:00:00Z',status:'devolucao',total:100,paymentStatus:'pago',payments:[{id:'PAY-1',amount:100,method:'pix',paidAt:'2026-09-28T12:00:00Z'}]}],
  billingInstallments:[{id:'DIA-1',rentalId:'LOC-1',sequence:1,dueAt:'2026-09-28T10:00:00Z',amount:100,payments:[{id:'DPAY-1',amount:100,method:'pix',paidAt:'2026-09-28T12:00:00Z'}]}],
  inspections:[{id:'VIS-1',rentalId:'LOC-1',vehicleId:'VEI-1',kind:'return',status:'completed',mileage:1000,fuelLevel:'Cheio',photos:[],damages:[],notes:'Sem avarias',checklist:[{label:'Pneus',done:true}]}],
  issuedContracts:[{id:'CTR-1',rentalId:'LOC-1',templateName:'Padrao',templateVersion:1,createdAt:'2026-09-28T09:00:00Z',renderedText:'Clausula principal'}],
  contractTemplates:[],billingPlans:[],collectionActions:[],maintenance:[],alertState:{},expenses:[],ledger:[],audit:[]
};}

test('fase 11 aplica o branding efetivo em todos os PDFs sem perder conteudo operacional',()=>{
  const s=snapshot();
  const docs=[
    decode(rentalContractPdf(s,'LOC-1')),
    decode(rentalReceiptPdf(s,'LOC-1')),
    decode(dailyPaymentReceiptPdf(s,'DIA-1','DPAY-1')),
    decode(inspectionPdf(s,'VIS-1')),
    decode(issuedContractPdf(s,'CTR-1'))
  ];
  for(const pdf of docs){
    assert.ok(pdf.startsWith('%PDF-1.4'));
    assert.match(pdf,/George Rent/,'nome comercial deve aparecer no cabecalho');
    assert.match(pdf,/Mobilidade do seu jeito/,'slogan deve aparecer no cabecalho');
  }
  assert.match(docs[0],/Cliente: Ana/);
  assert.match(docs[1],/Valor recebido/);
  assert.match(docs[2],/Pagamento: DPAY-1/);
  assert.match(docs[3],/Sem avarias/);
  assert.match(docs[4],/Clausula principal/);
});
