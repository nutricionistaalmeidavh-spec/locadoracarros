# Sistema Locadora

Sistema standalone de gestão de locação de veículos da ArtiSys.

Este repositório foi separado do antigo monorepo `PDVNexus` para que a Locadora evolua de forma independente.

## P0

- Agenda/reservas com bloqueio de conflito por veículo e período.
- Login local com RBAC para `admin`, `atendente` e `vistoriador`.
- Financeiro com contas a receber, pagamentos parciais, despesas e caixa líquido.
- Auditoria de ações críticas.
- Backup verificável com SHA-256.
- Migração de snapshot/backup legado 0.1.5.

## P1

- Dashboard operacional e financeiro com ocupação, atrasos, ticket médio e rentabilidade por veículo.
- Vistorias de retirada/devolução com checklist obrigatório, fotos, quilometragem, combustível, avarias e PDF.
- Manutenção preventiva/corretiva por data ou quilometragem, bloqueio automático da frota e custo vinculado ao veículo/financeiro.
- Alertas para devolução atrasada, manutenção vencida, seguro/licenciamento/inspeção e CNH.
- Cadastro complementar de validade da CNH e documentos do veículo.
- Contrato, recibo e relatório de vistoria em PDF real, sem serviço externo.
- Persistência v3 com migração automática dos dados P0/v2.
- RBAC ampliado para vistoria, manutenção, alertas, documentos e backup.

A implementação segue as capacidades já catalogadas no `utilidades` (`artisys-checklists`, `artisys-alerts`, `artisys-pdf`, `artisys-dashboard`/reporting) e os padrões de dashboard, tabelas, formulários, diálogos e feedback do `frontEnds`, mantendo o runtime principal R$ 0 / local / self-hosted.

## Acesso inicial

- Usuário: `admin`
- Senha: `1234`

Troque as credenciais no processo de implantação real.

## Executar

```bash
npm test
npm run check
npm run serve
```

Depois acesse `http://localhost:4173`.

## Desktop Windows

```bash
npm install
npm run desktop
npm run dist
```

O instalador NSIS x64 é gerado em `release/`.

## Dados

O armazenamento principal usa `localStorage` com a chave `artisys:locadora:store:v3`.

Na primeira abertura, o sistema migra automaticamente:

- `artisys:locadora:store:v2` (P0)
- `aluguel-veiculo:store:v1` (versão 0.1.5)

sem apagar as chaves anteriores.

## P2 — PC ↔ Mobile (sem multi-tenant)

- Acesso mobile responsivo pela mesma rede do PC.
- Servidor LAN embutido no Electron, sem nuvem e sem serviço pago.
- Pareamento por link + token persistente do PC.
- Sincronização manual ou automática entre PC e celular.
- Revisões de sincronização e resolução determinística de conflito por `updatedAt`.
- Em conflito com versão remota mais nova, a cópia local anterior é preservada para recuperação.
- PWA com manifest e service worker quando o navegador estiver em contexto seguro; em LAN HTTP o acesso mobile continua funcionando como web app local.
- Ponte `ReactNativeWebView.postMessage` mantida para eventual wrapper mobile sem alterar o domínio.
- RBAC de sincronização disponível para Admin, Atendente e Vistoriador.

### Usar no celular

No aplicativo desktop, abra **PC ↔ Mobile** e copie um dos links de pareamento. O celular precisa estar na mesma rede do PC. Ao abrir o link, o token é salvo no dispositivo e removido da barra de endereço.

O PC usa a porta `4174` quando disponível; se ela estiver ocupada, escolhe automaticamente outra porta e mostra o endereço correto na tela.

Não há multi-tenant nesta versão: existe uma única base da Locadora sendo sincronizada entre os dispositivos autorizados.
