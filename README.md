# Sistema Locadora

Sistema standalone de gestão de locação de veículos da ArtiSys.

Este repositório foi separado do antigo monorepo `PDVNexus` para que a Locadora evolua de forma independente.

## P0 entregue

- Agenda/reservas com bloqueio de conflito por veículo e período.
- Login local com RBAC para `admin`, `atendente` e `vistoriador`.
- Financeiro determinístico com contas a receber, pagamentos parciais, despesas e caixa líquido.
- Auditoria de ações críticas.
- Backup v2 com SHA-256 e validação de integridade.
- Migração de snapshot/backup legado 0.1.5.
- Cadastro de clientes, frota, contratos, reservas, recebimentos e despesas.
- Interface responsiva web/desktop-friendly, sem serviço pago obrigatório.

## Acesso inicial

- Usuário: `admin`
- Senha: `1234`

Troque as credenciais no processo de implantação real.

## Executar

O app é estático e não depende de backend obrigatório:

```bash
npm test
npm run check
npm run serve
```

Depois acesse `http://localhost:4173`.

## Dados

O armazenamento principal usa `localStorage` com a chave `artisys:locadora:store:v2`. Se existir a chave antiga `aluguel-veiculo:store:v1`, a migração para v2 acontece automaticamente.

## Origem

A base funcional foi migrada da Software Factory/`PDVNexus`, preservando os domínios de clientes, frota, locações, financeiro e documentos, agora desacoplados do PDV.
