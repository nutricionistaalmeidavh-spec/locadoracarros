# Locadora — Contratos, Cobranças Recorrentes e Inadimplência

## Objetivo

Fechar as três lacunas comerciais escolhidas na comparação com o LocaGestor: editor de contratos, cobranças recorrentes e painel de inadimplência, mantendo o Sistema Locadora local-first, sem multi-tenant e sem gateway externo obrigatório.

## Restrições

- Desktop Windows + PWA responsiva.
- Persistência durável somente no SQLite já existente; não usar `localStorage`.
- Sem Asaas ou outro serviço de cobrança nesta entrega.
- Sem multi-tenant.
- O snapshot continua sendo a unidade persistida no SQLite e sincronizada PC ↔ PWA.
- Toda mutação crítica gera auditoria.
- Novas coleções entram no merge por entidade da sincronização.

## Modelo de dados

O snapshot sobe para versão 4 e passa a normalizar:

- `contractTemplates`: modelos de contrato editáveis, versionados e com um padrão ativo.
- `issuedContracts`: cópia imutável do texto renderizado no momento da emissão.
- `billingPlans`: plano de parcelamento/recorrência associado a uma locação.
- `billingInstallments`: parcelas com vencimento, principal, encargos, status e vínculo ao ledger.
- `billingPayments`: pagamentos das parcelas, separando principal de encargos.
- `collectionActivities`: histórico de contatos de cobrança/promessas/próxima ação.

## Editor de contratos

Modelos são texto multilinha com variáveis `{{...}}`. O conjunto inicial cobre locadora, cliente, CNH, veículo, locação, atendente e condições do plano financeiro. Exemplos: `{{cliente.nome}}`, `{{cliente.cpf}}`, `{{veiculo.placa}}`, `{{locacao.valor_total}}`, `{{cobranca.periodicidade}}`.

A interface permite criar, editar, duplicar, arquivar, definir padrão, pré-visualizar e emitir um contrato para uma locação. Variáveis desconhecidas ficam explicitamente marcadas na prévia para impedir emissão silenciosamente incompleta. A emissão grava `renderedBody`, nome/versão do modelo, locação, emissor e timestamp. O PDF é gerado da cópia emitida, portanto alterações futuras no modelo não alteram contratos históricos.

## Cobranças recorrentes

Cada locação pode ter no máximo um plano ativo. O plano parcela o saldo principal ainda não recebido. Periodicidades suportadas: diária, semanal, quinzenal, mensal e intervalo personalizado em dias. O número de parcelas é finito nesta versão.

Ao ativar o plano, o recebível único antigo da locação é substituído contabilmente pelas parcelas sem duplicar receita prevista: a parte já recebida permanece histórica e o saldo é dividido em novos lançamentos `receivable` vinculados às parcelas.

Pagamentos de parcelas atualizam simultaneamente a parcela, o ledger e o histórico de pagamentos da locação para o principal. Encargos efetivamente recebidos entram como recebível pago separado, preservando a receita adicional sem inflar o valor original da locação.

Multa é percentual único após o vencimento. Juros são simples, mensais e pró-rata diário. Quando o principal é quitado, os encargos param de crescer na data de quitação do principal.

## Inadimplência

Uma parcela é inadimplente quando está vencida e ainda possui principal ou encargos em aberto. O painel mostra total vencido, clientes inadimplentes, vencendo hoje, próximos sete dias e atraso médio.

A tabela mostra cliente, locação, veículo, vencimento, dias de atraso, principal, encargos e total atualizado. O aging é agrupado em 1–7, 8–15, 16–30, 31–60 e 60+ dias.

A régua de cobrança é manual: registra canal, observação, promessa de pagamento, próxima ação, autor e horário. O histórico fica vinculado ao cliente e opcionalmente à parcela/locação.

## Permissões

- Admin: tudo.
- Atendente: leitura/escrita de contratos, cobranças e inadimplência/régua de cobrança.
- Vistoriador: sem novas permissões comerciais.

## Sincronização e conflitos

As seis novas coleções são adicionadas à lista de coleções mescladas por ID. Cada entidade criada ou modificada carrega `createdAt`/`updatedAt`, permitindo o merge existente escolher a versão mais recente por entidade. Contratos emitidos e pagamentos são append-only na operação normal.

## Compatibilidade

Snapshots anteriores ganham as novas coleções vazias automaticamente. O fluxo antigo de contrato PDF permanece disponível para compatibilidade, enquanto a nova área `Contratos` passa a ser o caminho configurável. Locações sem plano recorrente continuam usando o recebível único e o fluxo financeiro atual.

## Critérios de conclusão

- Contratos configuráveis e históricos geram PDF a partir do texto emitido.
- Planos geram parcelas sem duplicar receita no financeiro.
- Pagamento parcial e total atualiza parcela, locação e ledger.
- Multa/juros são determinísticos por data de referência.
- Painel de inadimplência e aging refletem as parcelas.
- Régua de cobrança persiste e sincroniza.
- Snapshot v3 existente migra implicitamente para v4 sem perda.
- Testes novos e regressão existente passam antes do merge.