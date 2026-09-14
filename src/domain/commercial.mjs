import { ensureP1Snapshot, appendAudit } from './p1.mjs';

const COLLECTIONS=['contractTemplates','issuedContracts','billingPlans','billingInstallments','billingPayments','collectionActivities'];
function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
function now(){return new Date().toISOString();}
function newId(prefix){if(typeof globalThis.crypto?.randomUUID==='function')return `${prefix}-${globalThis.crypto.randomUUID()}`;return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
function requireText(value,label){const text=String(value??'').trim();if(!text)throw new Error(`${label} é obrigatório.`);return text;}
function money(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR'):String(value??'');}

export function ensureCommercialSnapshot(input){
  const snapshot=ensureP1Snapshot(input);
  snapshot.version=Math.max(Number(snapshot.version||0),4);
  for(const key of COLLECTIONS)snapshot[key]=Array.isArray(snapshot[key])?snapshot[key]:[];
  return snapshot;
}

function template(snapshot,id){const found=snapshot.contractTemplates.find(item=>item.id===id);if(!found)throw new Error('Modelo de contrato não encontrado.');return found;}

export function createContractTemplate(input,{name,body,isDefault=false}={},actorId){
  const snapshot=ensureCommercialSnapshot(input),at=now();
  const active=snapshot.contractTemplates.filter(item=>!item.archivedAt);
  const value={id:newId('CTR'),name:requireText(name,'Nome'),body:requireText(body,'Conteúdo'),version:1,isDefault:Boolean(isDefault)||active.length===0,createdAt:at,updatedAt:at,archivedAt:null};
  if(value.isDefault)for(const item of snapshot.contractTemplates)item.isDefault=false;
  snapshot.contractTemplates.unshift(value);
  appendAudit(snapshot,{actorId,action:'contract_template.created',entityType:'contract_template',entityId:value.id,details:{name:value.name,isDefault:value.isDefault}});
  return snapshot;
}

export function updateContractTemplate(input,id,patch={},actorId){
  const snapshot=ensureCommercialSnapshot(input),current=template(snapshot,id);if(current.archivedAt)throw new Error('Modelo arquivado não pode ser editado.');
  const nextName=patch.name==null?current.name:requireText(patch.name,'Nome'),nextBody=patch.body==null?current.body:requireText(patch.body,'Conteúdo');
  const changed=nextName!==current.name||nextBody!==current.body;
  current.name=nextName;current.body=nextBody;if(changed)current.version=Math.max(1,Number(current.version)||1)+1;current.updatedAt=now();
  if(patch.isDefault===true){for(const item of snapshot.contractTemplates)item.isDefault=item.id===id;current.isDefault=true;}
  appendAudit(snapshot,{actorId,action:'contract_template.updated',entityType:'contract_template',entityId:id,details:{version:current.version}});return snapshot;
}

export function duplicateContractTemplate(input,id,{name}={},actorId){
  const snapshot=ensureCommercialSnapshot(input),source=template(snapshot,id);
  return createContractTemplate(snapshot,{name:requireText(name??`${source.name} (cópia)`,'Nome'),body:source.body,isDefault:false},actorId);
}

export function setDefaultContractTemplate(input,id,actorId){
  const snapshot=ensureCommercialSnapshot(input),current=template(snapshot,id);if(current.archivedAt)throw new Error('Modelo arquivado não pode ser padrão.');
  for(const item of snapshot.contractTemplates)item.isDefault=item.id===id;
  current.updatedAt=now();appendAudit(snapshot,{actorId,action:'contract_template.default_changed',entityType:'contract_template',entityId:id});return snapshot;
}

export function archiveContractTemplate(input,id,actorId){
  const snapshot=ensureCommercialSnapshot(input),current=template(snapshot,id);if(current.archivedAt)return snapshot;
  current.archivedAt=now();current.isDefault=false;current.updatedAt=current.archivedAt;
  const active=snapshot.contractTemplates.find(item=>!item.archivedAt&&item.id!==id);if(active&&!snapshot.contractTemplates.some(item=>!item.archivedAt&&item.isDefault))active.isDefault=true;
  appendAudit(snapshot,{actorId,action:'contract_template.archived',entityType:'contract_template',entityId:id});return snapshot;
}

export function contractVariables(input,rentalId){
  const snapshot=ensureCommercialSnapshot(input),rental=snapshot.rentals.find(item=>item.id===rentalId);if(!rental)throw new Error('Locação não encontrada.');
  const customer=snapshot.customers.find(item=>item.id===rental.customerId)??{},vehicle=snapshot.vehicles.find(item=>item.id===rental.vehicleId)??{},attendant=snapshot.users.find(item=>item.id===rental.attendantId)??{},settings=snapshot.settings??{};
  const plan=snapshot.billingPlans.find(item=>item.rentalId===rentalId&&item.status==='active');
  const periodicity={daily:'Diária',weekly:'Semanal',biweekly:'Quinzenal',monthly:'Mensal',custom:'Personalizada'}[plan?.cadence]??'';
  return {
    'locadora.nome':settings.companyName??'','locadora.documento':settings.document??'','locadora.telefone':settings.phone??'','locadora.endereco':settings.address??'',
    'cliente.nome':customer.name??'','cliente.cpf':customer.document??'','cliente.documento':customer.document??'','cliente.telefone':customer.phone??'','cliente.email':customer.email??'','cliente.endereco':customer.address??'',
    'cliente.cnh.numero':customer.driverLicense?.number??'','cliente.cnh.categoria':customer.driverLicense?.category??'','cliente.cnh.validade':date(customer.driverLicense?.expiry),
    'veiculo.modelo':vehicle.model??'','veiculo.placa':vehicle.plate??'','veiculo.ano':vehicle.year??'','veiculo.km':vehicle.mileage??'','veiculo.categoria':vehicle.category??'','veiculo.cor':vehicle.color??'',
    'locacao.id':rental.id??'','locacao.retirada':date(rental.pickupAt),'locacao.devolucao':date(rental.returnAt),'locacao.diaria':money(rental.dailyRate),'locacao.dias':rental.days??'','locacao.valor_total':money(rental.total),'locacao.status':rental.status??'','locacao.status_financeiro':rental.paymentStatus??'','locacao.observacoes':rental.notes??'',
    'atendente.nome':attendant.name??'',
    'cobranca.periodicidade':periodicity,'cobranca.parcelas':plan?.installmentCount??'','cobranca.multa':plan?`${Number(plan.finePercent||0).toLocaleString('pt-BR')}%`:'','cobranca.juros':plan?`${Number(plan.interestPercentMonthly||0).toLocaleString('pt-BR')}% a.m.`:''
  };
}

export function renderContractTemplate(input,rentalId,templateId){
  const snapshot=ensureCommercialSnapshot(input),current=template(snapshot,templateId),vars=contractVariables(snapshot,rentalId),unknown=[];
  const text=current.body.replace(/\{\{\s*([^{}]+?)\s*\}\}/g,(_,raw)=>{const key=String(raw).trim();if(Object.hasOwn(vars,key))return String(vars[key]??'');if(!unknown.includes(key))unknown.push(key);return `⟦VARIÁVEL: ${key}⟧`;});
  return {text,unknownVariables:unknown,variables:vars,template:clone(current)};
}

export function issueContract(input,{rentalId,templateId}={},actorId){
  const snapshot=ensureCommercialSnapshot(input);const chosen=templateId?template(snapshot,templateId):snapshot.contractTemplates.find(item=>item.isDefault&&!item.archivedAt);
  if(!chosen)throw new Error('Nenhum modelo de contrato disponível.');if(chosen.archivedAt)throw new Error('Modelo de contrato arquivado.');
  const rendered=renderContractTemplate(snapshot,rentalId,chosen.id);if(rendered.unknownVariables.length)throw new Error(`Contrato possui variáveis desconhecidas: ${rendered.unknownVariables.join(', ')}.`);
  const at=now(),value={id:newId('EMI'),rentalId,templateId:chosen.id,templateName:chosen.name,templateVersion:chosen.version,renderedBody:rendered.text,issuedAt:at,issuedBy:actorId,createdAt:at,updatedAt:at};
  snapshot.issuedContracts.unshift(value);appendAudit(snapshot,{actorId,action:'contract.issued',entityType:'issued_contract',entityId:value.id,details:{rentalId,templateId:chosen.id,templateVersion:chosen.version}});return snapshot;
}

export const CONTRACT_VARIABLE_KEYS=Object.freeze(['locadora.nome','locadora.documento','locadora.telefone','locadora.endereco','cliente.nome','cliente.cpf','cliente.telefone','cliente.email','cliente.endereco','cliente.cnh.numero','cliente.cnh.categoria','cliente.cnh.validade','veiculo.modelo','veiculo.placa','veiculo.ano','veiculo.km','veiculo.categoria','veiculo.cor','locacao.id','locacao.retirada','locacao.devolucao','locacao.diaria','locacao.dias','locacao.valor_total','locacao.status','locacao.status_financeiro','locacao.observacoes','atendente.nome','cobranca.periodicidade','cobranca.parcelas','cobranca.multa','cobranca.juros']);