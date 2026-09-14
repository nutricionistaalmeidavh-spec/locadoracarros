# Sistema Locadora

Sistema standalone de gestão de locação de veículos da ArtiSys.

## Escopo final

- Desktop Windows em Electron.
- Mobile via PWA responsiva.
- Uma única operação da locadora: **sem multi-tenant**.
- Dados e arquivos persistentes sempre em **SQLite local**.
- Sincronização PC ↔ PWA opcional pela rede configurada.
- Nenhum backend de dados obrigatório.

## Funcionalidades

### P0
- Agenda/reservas com bloqueio de conflito por veículo e período.
- Login local e RBAC para Admin, Atendente e Vistoriador.
- Financeiro com contas a receber, pagamentos parciais, despesas e caixa líquido.
- Auditoria.
- Backup verificável com SHA-256.

### P1
- Dashboard operacional e financeiro.
- Vistorias de retirada/devolução com checklist, fotos, KM, combustível e avarias.
- Manutenção por data/quilometragem e custos vinculados ao veículo.
- Alertas de devolução, manutenção, documentos do veículo e CNH.
- Contrato, recibo e relatório de vistoria em PDF.
- Rentabilidade por veículo.

### P2
- PWA responsiva para celular/tablet.
- Fila offline persistente.
- Pareamento PC ↔ PWA por endereço + token.
- Sincronização manual ou automática.
- Revisões e cópia de recuperação em conflitos.
- Merge por entidade para preservar alterações concorrentes em clientes, veículos, locações, vistorias, manutenção, financeiro e auditoria.

## Persistência SQLite

### Desktop

O Electron cria um único banco no diretório de dados do usuário:

```text
locadora.sqlite
```

Nele ficam:

- snapshot operacional;
- clientes, veículos, locações, financeiro e vistorias contidos no snapshot;
- fotos/evidências das vistorias;
- token de pareamento;
- fila/metadados de sincronização;
- estado do servidor LAN.

Não são mantidos arquivos JSON paralelos para estado persistente. Instalações que ainda possuírem os antigos `sync-config.json`/`sync-state.json` têm esses sidecars absorvidos pelo SQLite e removidos.

### PWA

A PWA usa SQLite/WASM e grava o arquivo `locadora.sqlite` no armazenamento privado do navegador via OPFS. O runtime SQLite é vendorizado no build e funciona offline depois da instalação da PWA.

A PWA deve ser publicada em **HTTPS** para habilitar Service Worker, OPFS e instalação adequada no celular.

## Preparar a PWA

```bash
npm install
npm run pwa:prepare
```

Isso copia `sql-wasm.js` e `sql-wasm.wasm` para `vendor/sqlite/`.

## Desenvolvimento

```bash
npm install
npm test
npm run check
npm run desktop
```

## Gerar instalador Windows

```bash
npm install
npm run dist
```

Saída esperada:

```text
release/Sistema-Locadora-Setup-0.6.0.exe
```

## Acesso inicial

- Usuário: `admin`
- Senha: `1234`

A credencial inicial deve ser alterada na implantação.
