# GD Locações — Fases 16–18

Data: 2026-09-28

## Objetivo

Fechar a integração visual e o release da identidade GD Locações após as Fases 0–15, sem adicionar novas regras de negócio. O bloco final existe para detectar resíduos visuais, validar os fluxos reais em múltiplos tamanhos/plataformas e consolidar uma entrega final verificável.

## Princípios

1. Dourado permanece cor de assinatura, não de leitura principal.
2. Azul-marinho, branco e neutros sustentam conteúdo e hierarquia.
3. Verde/vermelho continuam reservados para significado operacional.
4. Nenhuma alteração deste bloco deve mudar regras de locação, financeiro, autenticação, persistência, sync ou RBAC.
5. Correções encontradas durante regressão devem ser mínimas e acompanhadas por teste de regressão sempre que possível.
6. A entrega só é considerada pronta quando os gates de código e o instalador Windows passarem na branch final.

## Fase 16 — Regressão visual final

### Escopo

Auditar todas as superfícies já existentes:

- login;
- shell/sidebar/topbar;
- dashboard;
- reservas e locações;
- clientes;
- frota;
- vistorias e manutenção;
- financeiro, cobranças e inadimplência;
- documentos e contratos;
- sync;
- auditoria;
- configurações e aparência;
- modais, tabelas, formulários, estados vazios, loading, sucesso e erro;
- PWA e Electron.

### Itens obrigatórios da varredura

- referências visíveis antigas: `ARTISYS`, `LV`, `Sistema Locadora`, nomes genéricos de produto;
- laranja legado e outras cores que conflitem com a direção GD;
- dourado aplicado a KPIs, preços, números ou texto corrido;
- fundos amarelados ou gradientes decorativos excessivos;
- tipografia/hierarquia inconsistente;
- botões principais/secundários visualmente conflitantes;
- estados semânticos dependentes apenas de cor;
- espaçamentos quebrados ou desalinhamentos introduzidos pelas fases anteriores.

### Estratégia

A auditoria deve ser orientada por busca estática + testes existentes + inspeção das telas cobertas por E2E. Achados objetivos viram testes de regressão antes da correção quando houver um contrato estável que possa ser automatizado.

### Critérios de aceite

- não restam marcas visíveis antigas nas superfícies de produto;
- dourado aparece apenas em usos permitidos;
- nenhum KPI/preço/texto principal depende de dourado para leitura;
- nenhum fluxo funcional é alterado para resolver um problema meramente visual;
- testes de fases anteriores continuam verdes.

## Fase 17 — QA funcional e multiplataforma

### Matriz mínima

#### Larguras

- 360 px;
- 768 px;
- 1280 px;
- Electron na janela mínima atualmente suportada.

#### Fluxos

- autenticação e logout;
- dashboard;
- criar/editar reserva;
- criar/editar cliente;
- cadastrar/editar veículo;
- registrar recebimento/despesa;
- abrir documentos/contratos;
- editar aparência e recarregar;
- backup/restore;
- sync;
- navegação por teclado e Escape em modais;
- instalação/execução PWA quando coberta por testes estáticos/funcionais;
- aplicação empacotada no Windows.

### Regras de QA

- nenhuma ação essencial pode ficar fora da viewport sem forma de acesso;
- tabelas largas devem continuar utilizáveis;
- modais não podem extrapolar horizontalmente a viewport;
- formulários devem permanecer preenchíveis em touch e teclado;
- foco deve continuar visível;
- estados dinâmicos importantes devem continuar anunciáveis/acessíveis;
- alterações de densidade não podem quebrar layout ou foco.

### Critérios de aceite

- E2E cobre os tamanhos de referência já definidos nas Fases 14–15;
- fluxos essenciais passam sem regressão;
- não há overflow horizontal impeditivo nos cenários de referência;
- backup/restore e sync continuam preservando `settings.branding`;
- aplicação Electron continua abrindo com as proteções de segurança existentes.

## Fase 18 — Release final

### Gates obrigatórios

Na branch final:

1. `npm run verify`;
2. coverage;
3. Electron E2E;
4. ArtiSys QA release gate;
5. Windows Build;
6. validação do instalador;
7. instalação silenciosa de QA;
8. execução do app empacotado;
9. upload do artefato.

### Artefatos e nomenclatura

- nome visível do produto: `GD Locações`;
- instalador canônico: `GD-Locacoes-Setup-${version}.exe`;
- aliases técnicos de compatibilidade podem existir apenas quando forem invisíveis ao usuário e necessários ao CI legado;
- nenhum alias legado deve aparecer em UI, título de janela, manifesto ou documentação de usuário.

### Documentação final

Atualizar documentação de branding/release com:

- tokens e regra de uso do dourado;
- estrutura central de branding;
- PWA/Desktop/PDFs cobertos;
- comportamento de `settings.branding`;
- como rodar os gates de release;
- quais resíduos legados são intencionais e puramente técnicos, se existirem.

### Critérios de aceite

- branch final passa em todos os gates;
- instalador é gerado, validado, instalado e executado pelo CI;
- PR final descreve claramente escopo e evidência dos gates;
- `main` não é alterada até ordem explícita de merge.

## Estratégia de implementação

O trabalho será feito em `feat/gd-branding-phases-16-18`, criada a partir da `main` pós-Fase 15.

Sequência:

1. criar contratos de regressão para resíduos visuais detectáveis;
2. executar auditoria e corrigir somente achados confirmados;
3. ampliar/ajustar E2E de QA para cobrir lacunas reais da matriz;
4. atualizar documentação final;
5. executar todos os gates;
6. abrir/atualizar PR final pronta para revisão.

## Fora de escopo

- novas funcionalidades comerciais;
- mudança de regras de locação ou cobrança;
- novo motor de tema;
- upload livre de logo;
- seletor livre de cores;
- reescrita de arquitetura existente sem evidência de necessidade;
- migração de banco;
- novos serviços pagos.

## Definição de pronto

As Fases 16–18 estão concluídas quando:

- a regressão visual não encontra resíduos relevantes ou os achados foram corrigidos;
- QA cobre os fluxos e tamanhos definidos;
- Verify, coverage, Electron E2E, QA release e Windows Build passam na branch final;
- instalador Windows é validado e executado;
- documentação final está atualizada;
- PR final está pronta para merge, mas ainda não integrada à `main` sem autorização explícita.
