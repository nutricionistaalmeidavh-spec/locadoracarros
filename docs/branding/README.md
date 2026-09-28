# Branding — GD Locações

Esta pasta reúne os artefatos e a documentação da identidade visual do produto.

## Regra visual principal

O **dourado é cor de assinatura**, não de leitura principal. Ele pode aparecer na logo, CTA principal, item ativo, foco e pequenos detalhes. KPIs, preços, números, textos corridos e superfícies de leitura permanecem em azul-marinho, branco e neutros. Verde e vermelho ficam reservados a significado operacional.

## Arquitetura

A identidade efetiva é centralizada em `src/domain/branding.mjs`. Preferências persistidas ficam em `settings.branding`, com fallback seguro para o padrão GD Locações. O nome comercial continua em `settings.companyName`.

Superfícies cobertas:

- PWA: manifesto, favicon, theme-color e cache;
- Desktop Electron: nome do produto, título de janela e instalador;
- UI autenticada e login;
- PDFs de contrato, recibos, diária, vistoria e contratos emitidos;
- tela administrativa de Aparência;
- responsividade e acessibilidade.

## Release

Instalador canônico:

```text
GD-Locacoes-Setup-${version}.exe
```

Gates manuais equivalentes aos usados no CI:

```bash
npm run verify
npm run coverage
npm run e2e
npm run qa:release
npm run dist
```

## Compatibilidade técnica legada

Os nomes `Sistema-Locadora-Setup-*` e `Sistema Locadora.exe` podem existir somente como **alias técnico** necessário ao workflow/build legado. Esses aliases não devem aparecer em UI, manifesto, título de janela, documentação de usuário ou identidade comercial.

O `appId` permanece estável para preservar o contexto de instalação e dados existentes.
