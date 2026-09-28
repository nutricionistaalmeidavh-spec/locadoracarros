# Inventário visual — GD Locações (Fase 0)

Data do baseline: 2026-09-28

## Objetivo

Registrar a superfície visual existente antes da aplicação do tema GD Locações. As fases 0–2 criam apenas a fundação de branding; não alteram regras de negócio, autenticação, persistência, sincronização, financeiro ou fluxo de locações.

## Superfície atual

### `styles.css`

- Base global: texto `#20242d`, fundo `#f4f5f7`.
- Sidebar/login: `#151922`.
- Marca/CTA atual: laranja `#f37a20`.
- Navegação ativa: fundo `#242a35`, texto branco e barra lateral laranja.
- Cards/painéis/veículos: branco, bordas em `#e3e6ea`/`#eef0f2`.
- Estados operacionais mantêm semântica própria: reserva `#e99c31`, retirada `#4d8fe7`, em uso `#39a973`, devolução `#8a8f99`.
- Estados de erro/sucesso não devem ser substituídos pelas cores institucionais.

### `styles-p1.css`

- Alertas e checklists usam cores semânticas próprias.
- Warning: `#e99c31`/`#fff1d6`.
- Critical: `#d14343`/`#a51d1d`.

### `styles-p2.css`

- Sincronização usa verde `#18794e`/`#39a973` para sucesso/online.
- Erro: `#b42318`.
- Warning: `#f2c66d`/`#fff7e6`.

### `src/app.mjs`

- Shell atual exibe `LV / SISTEMA LOCADORA`.
- Login atual exibe `LV / ARTISYS / Sistema Locadora`.
- Esses pontos serão consumidores do componente de marca em fase posterior; não são trocados nas fases 0–2.

### Assets e PWA

- Asset existente: `assets/icon.svg`.
- `index.html` usa `#151922` como `theme-color` e `Sistema Locadora` como título.
- `manifest.webmanifest` e ícones atuais permanecem inalterados nesta etapa.
- `sw.js` mantém o shell offline e deve conhecer `styles-branding.css` para não perder os tokens offline.

## Identidade GD Locações

Referência fornecida pelo cliente: logo GD Locações com base azul-marinho/quase preta, dourado metálico, prata e branco, com o slogan **“Liberdade para seu destino”**.

Tokens iniciais:

- fundo principal: `#06111d`
- fundo secundário: `#0c1824`
- dourado: `#d8a22b`
- dourado claro: `#f0c85c`
- dourado escuro: `#9c6b12`
- prata: `#c8cbd0`
- prata escuro: `#81868d`
- branco: `#f7f7f7`
- texto: `#e9eaec`
- muted: `#9ca3ad`

## Baseline funcional — não alterar

As fases 0–2 não podem modificar:

- autenticação/RBAC;
- cadastro e fluxo de reservas/locações;
- diárias e recebimentos;
- financeiro/cobranças/inadimplência;
- SQLite/OPFS e persistência local;
- sincronização PC ↔ mobile;
- backup/restore;
- Cloudflare D1/R2;
- comportamento do Electron/PWA.

## Arquivos afetados nas fases 0–2

- `docs/branding/gd-visual-inventory.md` — este inventário.
- `styles-branding.css` — tokens e estilos neutros do componente de marca.
- `src/ui/branding.mjs` — contrato reutilizável da marca.
- `assets/branding/*` — logo/variantes técnicas.
- `index.html` — somente inclusão do stylesheet de tokens.
- `scripts/build-web.mjs` — empacotamento do novo stylesheet.
- `package.json` — empacotamento Electron do novo stylesheet.
- `sw.js` — cache offline do stylesheet.
- `tests/branding.test.mjs` — contrato automatizado das fases 0–2.

## Critério de conclusão da fase 2

A fundação está pronta quando os tokens podem ser carregados sem mudar a aparência atual, o branding possui um componente reutilizável com variantes `full`, `compact` e `icon`, os assets entram nos bundles Web/Desktop e os gates existentes permanecem verdes.
