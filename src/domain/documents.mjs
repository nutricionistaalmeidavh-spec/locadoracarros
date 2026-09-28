import { getEffectiveBranding } from './branding.mjs';
import { ensureP1Snapshot } from './p1.mjs';

function ascii(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?');}
function money(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR'):String(value??'');}
function escPdf(text){return ascii(text).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function pdfBrand(snapshot){return{branding:getEffectiveBranding(snapshot.settings),companyDocument:snapshot.settings?.document??''};}

export function buildSimplePdf({title='Documento',lines=[],branding=getEffectiveBranding({}),companyDocument=''}={}){
  const brand=branding&&typeof branding==='object'?branding:getEffectiveBranding({});
  const header=[brand.companyName||'GD Locações',brand.slogan||'Liberdade para seu destino',companyDocument?`Documento: ${companyDocument}`:''];
  const body=[ascii(title),'',...lines.map(ascii)];const chunks=[];for(let i=0;i<body.length;i+=40)chunks.push(body.slice(i,i+40));if(!chunks.length)chunks.push([]);
  const objects=[];const pageIds=[];const fontId=3;let nextId=4;
  for(const bodyLines of chunks){
    const pageId=nextId++,contentId=nextId++;pageIds.push(pageId);const linesOnPage=[...header.map(ascii),'',...bodyLines];
    const commands=['q','0.85 0.64 0.17 RG','1.2 w','50 735 m','545 735 l','S','Q','BT','/F1 11 Tf','50 790 Td'];
    linesOnPage.forEach((line,index)=>{if(index)commands.push('0 -16 Td');commands.push(`(${escPdf(line)}) Tj`);});
    commands.push('ET');const stream=commands.join('\n');objects[contentId]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
  }
  objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;objects[fontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let pdf='%PDF-1.4\n';const offsets=[0];for(let id=1;id<objects.length;id++){offsets[id]=pdf.length;pdf+=`${id} 0 obj\n${objects[id]}\nendobj\n`;}
  const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)pdf+=`${String(offsets[id]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function rentalData(snapshot,rentalId){const rental=snapshot.rentals.find(item=>item.id===rentalId);if(!rental)throw new Error('Locação não encontrada.');const customer=snapshot.customers.find(item=>item.id===rental.customerId);const vehicle=snapshot.vehicles.find(item=>item.id===rental.vehicleId);return{rental,customer,vehicle};}

export function rentalContractPdf(input,rentalId){const snapshot=ensureP1Snapshot(input);const{rental,customer,vehicle}=rentalData(snapshot,rentalId);return buildSimplePdf({...pdfBrand(snapshot),title:`CONTRATO DE LOCACAO ${rental.id}`,lines:[`Cliente: ${customer?.name??''} - ${customer?.document??''}`,`Veiculo: ${vehicle?.model??''} - Placa ${vehicle?.plate??''}`,`Retirada: ${date(rental.pickupAt??rental.pickupDate)}`,`Devolucao: ${rental.returnAt?date(rental.returnAt):'Locacao continua'}`,`Valor total: ${money(rental.total)}`,`Status financeiro: ${rental.paymentStatus??'aberto'}`,'',`Observacoes: ${rental.notes??''}`]});}

export function rentalReceiptPdf(input,rentalId){const snapshot=ensureP1Snapshot(input);const{rental,customer}=rentalData(snapshot,rentalId);const paid=(rental.payments??[]).reduce((sum,item)=>sum+Number(item.amount||0),0);return buildSimplePdf({...pdfBrand(snapshot),title:`RECIBO ${rental.id}`,lines:[`Cliente: ${customer?.name??''}`,`Valor recebido: ${money(paid)}`,`Saldo: ${money(Math.max(Number(rental.total||0)-paid,0))}`,...(rental.payments??[]).map(item=>`${date(item.paidAt)} - ${item.method}: ${money(item.amount)}`)]});}

export function dailyPaymentReceiptPdf(input,installmentId,paymentId){
  const snapshot=ensureP1Snapshot(input),installment=snapshot.billingInstallments.find(item=>item.id===installmentId);
  if(!installment)throw new Error('Diária não encontrada.');
  const payment=(installment.payments??[]).find(item=>item.id===paymentId);
  if(!payment)throw new Error('Pagamento da diária não encontrado.');
  const{rental,customer,vehicle}=rentalData(snapshot,installment.rentalId);
  return buildSimplePdf({...pdfBrand(snapshot),title:`RECIBO DIARIA ${rental.id}`,lines:[
    `Cliente: ${customer?.name??''} - ${customer?.document??''}`,
    `Veiculo: ${vehicle?.model??''} - Placa ${vehicle?.plate??''}`,
    `Locacao: ${rental.id}`,
    `Diaria: ${installment.sequence}`,
    `Data da diaria: ${String(installment.dueAt??'').slice(0,10)}`,
    `Valor da diaria: ${money(installment.amount)}`,
    `Valor recebido: ${money(payment.amount)}`,
    `Forma: ${payment.method??''}`,
    `Recebido em: ${date(payment.paidAt)}`,
    `Pagamento: ${payment.id}`
  ]});
}

export function inspectionPdf(input,inspectionId){const snapshot=ensureP1Snapshot(input);const value=snapshot.inspections.find(item=>item.id===inspectionId);if(!value)throw new Error('Vistoria não encontrada.');const vehicle=snapshot.vehicles.find(item=>item.id===value.vehicleId);return buildSimplePdf({...pdfBrand(snapshot),title:`VISTORIA ${value.id}`,lines:[`Veiculo: ${vehicle?.model??''} - ${vehicle?.plate??''}`,`Tipo: ${value.kind==='return'?'Devolucao':'Retirada'}`,`KM: ${value.mileage??''}`,`Combustivel: ${value.fuelLevel??''}`,`Fotos: ${value.photos?.length??0}`,`Avarias: ${value.damages?.length??0}`,`Observacoes: ${value.notes??''}`,...(value.checklist??[]).map(item=>`${item.done?'[OK]':'[ ]'} ${item.label}`)]});}

export function issuedContractPdf(input,issuedContractId){const snapshot=ensureP1Snapshot(input);const value=snapshot.issuedContracts.find(item=>item.id===issuedContractId);if(!value)throw new Error('Contrato emitido não encontrado.');return buildSimplePdf({...pdfBrand(snapshot),title:`CONTRATO EMITIDO ${value.id}`,lines:[`Locacao: ${value.rentalId}`,`Modelo: ${value.templateName} v${value.templateVersion}`,`Emitido em: ${date(value.createdAt)}`,'',...String(value.renderedText||'').split(/\r?\n/)]});}
