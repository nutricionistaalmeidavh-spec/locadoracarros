# Sistema Locadora Mobile — offline-first

Este shell Capacitor empacota o mesmo sistema web dentro do aplicativo Android/iOS. Por isso o app abre e funciona sem o PC, sem Wi‑Fi e sem internet.

## Fluxo

1. O usuário trabalha normalmente no celular; os dados ficam no armazenamento local do app.
2. Cada alteração é marcada como pendente de sincronização.
3. Quando o celular reencontra o PC na mesma rede, a sincronização pode ser manual ou automática.
4. O PC continua sendo o ponto local de sincronização. Não há multi-tenant nem serviço de nuvem obrigatório.

## Primeira preparação

```bash
cd mobile
npm install
npm run prepare:web
npx cap add android
# em macOS, para iOS:
npx cap add ios
npm run sync
```

Depois, use `npm run android` ou `npm run ios`.

## Pareamento

No PC, abra **PC ↔ Mobile** e copie o link de pareamento. No app mobile, abra a mesma tela, cole o link em **Link de pareamento** e toque em **Aplicar**. O endereço do PC e o token são salvos localmente no aparelho.

## Rede local

O Android está configurado para permitir o servidor HTTP local do PC. No iOS, após gerar a plataforma, mantenha a permissão de rede local (`NSLocalNetworkUsageDescription`) e a exceção de transporte para a LAN conforme as políticas da versão do iOS usada na compilação.
