# GD Locações — Fases 9–15

Data: 2026-09-28

## Objetivo

Concluir a integração da identidade GD Locações no produto sem transformar a paleta em cor de conteúdo. O sistema deve continuar sóbrio: azul-marinho, branco e neutros sustentam leitura; dourado funciona como assinatura; verde, vermelho e azul operacional mantêm significado semântico.

As Fases 9–15 abrangem PWA/mobile, desktop Electron, documentos PDF, modelo central de branding, painel administrativo de aparência, responsividade e acessibilidade. Regras de locação, financeiro, autenticação, armazenamento e sincronização não devem mudar por causa deste trabalho.

## Princípios visuais

1. Dourado não é cor de leitura para números, preços, KPIs ou texto corrido.
2. Dourado é permitido em logo, CTA principal, item ativo, foco e detalhes pequenos.
3. Verde e vermelho continuam reservados a sucesso/recebido e risco/atraso/erro.
4. Superfícies de leitura permanecem brancas, cinza-claro ou azul-marinho, conforme o contexto.
5. Nenhuma tela deve depender apenas de cor para transmitir estado.
6. O tema deve permanecer legível sem efeitos decorativos pesados, gradientes excessivos ou fundos amarelados.

## Arquitetura escolhida

Será usada uma arquitetura central de branding com a GD Locações como padrão. O domínio expõe um perfil de branding normalizado; a UI, os documentos e as superfícies de aplicação consomem esse perfil em vez de duplicar strings e escolhas visuais.

```text
src/domain/branding.mjs
  ├─ DEFAULT_GD_BRANDING
  ├─ normalizeBranding(settings)
  └─ getEffectiveBranding(settings)
        │
        ├─ src/ui/branding.mjs
        ├─ src/app.mjs
        ├─ src/ui/system.mjs
        └─ src/domain/documents.mjs

PWA estático
  ├─ index.html
  ├─ manifest.webmanifest
  ├─ sw.js
  └─ assets/branding/*

Desktop Electron
  ├─ package.json
  └─ electron/main.cjs
```

O nome da empresa já existente em `snapshot.settings.companyName` continuará sendo a fonte canônica do nome comercial/legal. Isso evita duplicar `companyName` em dois lugares e preserva compatibilidade com snapshots antigos e documentos existentes.

As preferências puramente visuais ficam em `snapshot.settings.branding`, preservadas naturalmente por backup e sync porque já fazem parte do snapshot. Não será criado armazenamento paralelo.

## Modelo de branding

`getEffectiveBranding(settings)` compõe o nome existente com preferências visuais normalizadas:

```js
{
  companyName: settings.companyName || 'GD Locações',
  slogan: 'Liberdade para seu destino',
  preset: 'gd',
  density: 'comfortable',
  logoVariant: 'gd'
}
```

Persistido em `settings.branding`:

```js
{
  slogan: 'Liberdade para seu destino',
  preset: 'gd',
  density: 'comfortable',
  logoVariant: 'gd'
}
```

### Valores suportados nesta entrega

- `preset`: somente `gd`.
- `density`: `comfortable` ou `compact`.
- `logoVariant`: somente `gd`.
- `slogan`: texto simples, limitado e escapado na renderização.

### Decisões de escopo

- `settings.companyName` continua editável pela configuração de Empresa e alimenta o branding efetivo.
- `preset` existe no modelo para manter uma interface estável, mas aparece como identidade institucional fixa nesta entrega, não como seletor livre.
- `density` pode ser escolhida entre `comfortable` e `compact`.
- `logoVariant` referencia apenas assets empacotados e conhecidos.
- Upload de logo binário, URL externa de logo, seletor de qualquer cor e editor livre de tema ficam fora do escopo. Isso evita snapshots grandes, dependência de rede, contraste inválido e divergência entre dispositivos.
- Valores ausentes, inválidos ou legados sempre caem para `DEFAULT_GD_BRANDING`.

## Fase 9 — PWA / celular

### Mudanças

- Alterar nome do manifesto para `GD Locações`.
- Alterar `short_name` para `GD` para evitar truncamento em launchers estreitos.
- Atualizar descrição para refletir a locadora.
- Usar azul-marinho GD como `theme_color`.
- Usar superfície neutra como `background_color`.
- Trocar favicon/ícone principal para o asset GD empacotado.
- Adicionar metadados coerentes no `index.html`.
- Atualizar `sw.js` e versão de cache para garantir entrega dos assets novos.
- Manter experiência `standalone`, offline-first e sem dependência externa.

### Critérios de aceite

- Instalação PWA mostra nome e ícone GD.
- Abrir offline continua funcionando após o primeiro carregamento.
- Manifesto não referencia marca genérica antiga.
- Atualização do service worker invalida o cache anterior de forma segura.

## Fase 10 — Desktop Electron

### Mudanças

- Alterar `productName` para `GD Locações`.
- Alterar nome do instalador para `GD-Locacoes-Setup-${version}`.
- Configurar título da janela como `GD Locações`.
- Configurar ícone da janela e do empacotamento a partir dos assets GD suportados pelo Electron/electron-builder.
- Preservar `appId` nesta entrega para não quebrar caminho de dados e comportamento de upgrade da instalação existente.
- Preservar sincronização LAN, sandbox, context isolation e armazenamento SQLite existentes.

### Critérios de aceite

- Instalador, atalho e janela exibem GD Locações.
- Build Windows continua instalando e abrindo normalmente.
- Banco `locadora.sqlite` e dados existentes continuam no mesmo contexto de aplicação.
- Nenhuma permissão Electron é ampliada.

## Fase 11 — Documentos

### Superfícies

- contrato de locação;
- recibo de locação;
- comprovante de pagamento de diária;
- vistoria;
- contrato emitido a partir de template.

### Mudanças

O gerador PDF atual permanece sem dependência externa. Será evoluído para aceitar um cabeçalho de marca com:

- nome comercial obtido de `settings.companyName` com fallback GD;
- slogan obtido do branding efetivo;
- identificação documental da empresa quando relevante;
- faixa/divisória discreta de marca;
- hierarquia tipográfica melhor entre título, metadados e corpo.

O dourado será usado apenas em elementos vetoriais pequenos do cabeçalho/divisória. Texto de conteúdo permanece escuro. Imagem raster da logo não é requisito desta fase, porque o gerador PDF atual é propositalmente simples e sem motor de imagens; a marca será representada no documento pelo cabeçalho GD consistente.

### Critérios de aceite

- PDFs continuam válidos e abríveis.
- Conteúdo jurídico/operacional existente não é removido.
- Nome e slogan vêm do branding efetivo.
- Contraste do documento funciona também em impressão monocromática.
- Testes existentes de PDF continuam passando, com novos testes para o cabeçalho.

## Fase 12 — Branding por empresa

### Mudanças

Criar `src/domain/branding.mjs` com responsabilidade única:

- definir padrão GD;
- normalizar `settings.branding`;
- compor `settings.companyName` com as preferências visuais;
- rejeitar valores fora das enumerações suportadas;
- fornecer branding efetivo para consumidores.

`ensureP1Snapshot` passa a garantir `snapshot.settings` e `snapshot.settings.branding` normalizados, sem eliminar campos de configuração já existentes.

### Compatibilidade

Snapshots antigos sem `branding` recebem o padrão GD em memória e passam a persistir o formato novo na próxima gravação normal. `settings.companyName`, `document`, `phone` e `address` permanecem no mesmo lugar. Backup e sync continuam funcionando no mesmo envelope/snapshot; não haverá migração destrutiva nem um segundo banco.

### Critérios de aceite

- snapshot legado abre sem erro;
- `settings.companyName` antigo continua sendo respeitado;
- valores inválidos de branding não quebram UI;
- backup/restore preserva branding;
- sync preserva branding;
- regras de negócio não importam o módulo de branding, exceto documentos que precisam do cabeçalho.

## Fase 13 — Configurações > Aparência

### Mudanças

A tela `Backup e configurações` recebe uma seção `Aparência`, disponível apenas para administrador, contendo:

- Nome comercial, reutilizando `settings.companyName`;
- Slogan;
- Identidade visual: `GD institucional`, exibida como opção fixa/informativa nesta entrega;
- Densidade: `Confortável` ou `Compacta`;
- ação `Restaurar padrão GD`.

A tela terá uma prévia pequena e funcional usando os mesmos componentes/tokens do sistema, sem criar um editor visual separado.

`Restaurar padrão GD` redefine slogan, preset, densidade e logo para o padrão GD. O nome comercial só volta para `GD Locações` após confirmação explícita dentro da própria ação, para evitar sobrescrever acidentalmente um nome de empresa já cadastrado.

### Restrições

- sem seletor RGB/HEX livre;
- sem upload de arquivo nesta fase;
- sem URL externa de imagem;
- sem CSS customizado pelo usuário;
- sem alteração de identidade por usuários não administradores.

### Critérios de aceite

- salvar aparência persiste no snapshot;
- reabrir/recarregar mantém a configuração;
- densidade aceita somente valores suportados;
- restaurar padrão volta aos valores GD de forma previsível;
- inputs são validados e escapados antes de renderização;
- backup/restore mantém as escolhas.

## Fase 14 — Responsividade

### Escopo

Revisar as superfícies já existentes, sem reconstruir navegação ou fluxos:

- shell/sidebar/topbar;
- dashboard;
- reservas;
- clientes/frota;
- vistorias/manutenção;
- financeiro/cobranças/inadimplência;
- contratos/documentos;
- sync;
- auditoria/configurações;
- login;
- modais e formulários.

### Regras

- breakpoints focados em comportamento, não em aparelhos específicos;
- nenhum conteúdo essencial fica inacessível abaixo de 900 px;
- tabelas largas usam contenção/scroll horizontal quando a transformação em cards não for segura;
- formulários passam para uma coluna quando necessário;
- CTAs e campos mantêm área de toque adequada;
- sidebar em telas estreitas não deve consumir altura excessiva nem esconder navegação;
- modais devem caber na viewport e permitir scroll interno quando necessário.

### Larguras de referência para QA

- telefone estreito: 360 px;
- telefone largo/tablet: 768 px;
- desktop: 1280 px;
- Electron: janela mínima atualmente suportada pelo aplicativo.

Essas larguras são referências de teste, não breakpoints obrigatórios de CSS.

### Critérios de aceite

- nenhuma ação essencial fica escondida nas larguras de referência;
- tabelas continuam acessíveis;
- formulários e modais não extrapolam horizontalmente a viewport;
- shell permanece navegável em touch e mouse.

## Fase 15 — Acessibilidade

### Mudanças

- preservar e ampliar `:focus-visible`;
- garantir labels associadas a campos e nomes acessíveis para botões apenas visuais;
- usar `aria-live`/papéis apropriados onde mensagens dinâmicas exigirem anúncio;
- corrigir contrastes que não atingirem leitura confortável;
- não usar só cor para status;
- adicionar estilos para `prefers-reduced-motion` caso haja transições/animações;
- garantir estados disabled, erro, sucesso e seleção perceptíveis por forma/texto/borda além da cor;
- manter ordem de tabulação compatível com ordem visual e DOM.

### Critérios de aceite

- login e navegação principal são operáveis por teclado;
- formulários principais são percorríveis sem mouse;
- foco nunca fica invisível;
- textos pequenos não usam dourado como cor principal;
- controles mantêm nome acessível;
- QA não introduz regressão visual nos estados semânticos.

## CSS e aplicação do tema

A arquitetura atual `styles-branding.css` + `styles-branding-balance.css` será preservada. Não haverá fusão agressiva nesta entrega.

Responsabilidades:

- `styles-branding.css`: identidade base e tokens GD;
- `styles-branding-balance.css`: correções de hierarquia e sobriedade;
- `styles-responsive-accessibility.css`: nova camada dedicada às Fases 14–15, carregada por último;
- CSS de domínio/telas existentes continua responsável pelo layout funcional original.

A densidade é aplicada por um atributo/classe no shell (`data-density`) e altera espaçamentos e alturas de controles dentro de limites predefinidos. Ela não altera regras de negócio nem estrutura de dados.

Tokens não devem ser usados diretamente para comunicar estados de negócio quando existir cor semântica específica.

## Fluxo de dados

```text
Carregamento do snapshot
  → ensureP1Snapshot
  → normalizeBranding(settings.branding)
  → getEffectiveBranding(settings)
  → renderização usa branding efetivo

Admin salva Empresa/Aparência
  → validação/normalização
  → save(snapshot)
  → persistência local
  → markDirty
  → sync existente
  → render

Backup
  → inclui snapshot.settings e snapshot.settings.branding
  → restore existente
  → ensureP1Snapshot
  → normalizeBranding
```

PWA e metadados do instalador continuam estáticos e representam a distribuição GD. Personalização interna não renomeia dinamicamente o pacote instalado nem o manifesto já instalado.

## Tratamento de erros

- Branding ausente ou inválido: fallback para padrão GD, sem bloquear inicialização.
- Campo de aparência inválido: normalização para valor suportado e mensagem clara quando necessário.
- Asset desconhecido: fallback para asset GD empacotado.
- Falha em PDF: manter erro explícito atual, sem documento parcialmente emitido.
- Falha de persistência/sync: continuar usando mecanismos existentes; branding não cria caminho alternativo.
- Service worker antigo: novo nome de cache remove versão obsoleta durante `activate`.

## Segurança

- Não aceitar CSS arbitrário, HTML, URL externa ou JavaScript em branding.
- Renderizar nome/slogan com escape de HTML nos pontos de UI.
- Manter Electron com `contextIsolation: true`, `nodeIntegration: false` e `sandbox: true`.
- Não criar novos IPCs para branding; configuração via snapshot/repositório existente.
- Não alterar RBAC: apenas administrador edita aparência.

## Testes e gates

A implementação seguirá TDD por fase.

### Testes unitários/contrato

- normalização de branding padrão/legado/inválido;
- preservação de `settings.companyName` legado;
- manifesto e metadados PWA;
- package/Electron branding;
- PDF com cabeçalho efetivo;
- persistência e restore de aparência;
- fallback de assets/presets;
- aplicação das duas densidades suportadas;
- regressão de hierarquia visual: sem dourado em números/KPIs;
- regras mínimas de responsividade e acessibilidade no CSS/DOM.

### Gates existentes

- `npm run check`;
- `npm test`;
- `npm run coverage:vertical`;
- coverage global;
- Electron E2E;
- ArtiSys QA release gate;
- Windows installer build;
- validação do instalador;
- instalação e teste do aplicativo empacotado.

## Arquivos esperados

Principais arquivos novos ou alterados:

- `src/domain/branding.mjs` (novo)
- `src/ui/branding.mjs`
- `src/app.mjs`
- `src/ui/system.mjs`
- `src/domain/p1.mjs`
- `src/domain/documents.mjs`
- `manifest.webmanifest`
- `index.html`
- `sw.js`
- `package.json`
- `electron/main.cjs`
- `styles-branding.css`
- `styles-branding-balance.css`
- `styles-responsive-accessibility.css` (novo)
- testes novos em `tests/`
- QA/E2E apenas quando necessário para cobrir comportamento real

## Fora do escopo

- regras de preço, diária, pagamento, multa, financeiro ou reserva;
- mudança de banco, schema SQLite ou protocolo de sync;
- login novo ou mudança de credenciais;
- upload de logo e armazenamento de mídia no snapshot;
- temas livres definidos por HEX/RGB;
- múltiplos presets visuais nesta entrega;
- dependências pagas;
- serviços de terceiros;
- reconstrução completa da UI;
- alteração de `appId` nesta entrega.

## Definição de concluído

As Fases 9–15 só estão concluídas quando:

1. PWA e Electron apresentam a marca GD de forma coerente.
2. Documentos usam branding efetivo sem sacrificar legibilidade.
3. Snapshot possui branding central normalizado e compatível com dados antigos.
4. Admin consegue ajustar apenas opções seguras e restaurar o padrão GD.
5. Telas principais funcionam em mobile/tablet/desktop sem esconder ações essenciais.
6. Navegação e formulários principais são utilizáveis por teclado e apresentam foco/contraste adequados.
7. Dourado permanece assinatura, não cor dominante de conteúdo.
8. Todos os gates de CI e Windows ficam verdes.
9. Não há regressão conhecida em locação, financeiro, persistência, backup ou sync.
