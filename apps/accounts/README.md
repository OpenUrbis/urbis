# Urbis Accounts (`@open-urbis/map-accounts`)

Aplicação frontend Angular responsável pela gestão de usuários, cadastro de representações legais, perfil, recuperação de credenciais e interface de autenticação do provedor OIDC.

---

## 🚀 Execução em Desenvolvimento

### Opção 1: Desenvolvimento com SSL Local e Domínio (Recomendado para OIDC)

Para suporte completo a redirecionamentos OAuth/OIDC e cookies de sessão:

1. **Hosts**: Adicione a linha no seu `/etc/hosts` ou `C:\Windows\System32\drivers\etc\hosts`:
   ```plaintext
   127.0.0.1 conta.urbis.prefeitura.sp.gov.br
   ```

2. **Gerar Certificados SSL**:
   Gere os certificados na raiz de `apps/accounts`:
   ```bash
   mkcert -install
   mkcert -key-file apps/accounts/conta.urbis.prefeitura.sp.gov.br-key.pem \
          -cert-file apps/accounts/conta.urbis.prefeitura.sp.gov.br.pem \
          conta.urbis.prefeitura.sp.gov.br localhost 127.0.0.1
   ```

3. **Iniciar com Proxy SSL**:
   ```bash
   pnpm --filter @open-urbis/map-accounts dev:ssl
   # ou a partir da raiz do monorepo:
   pnpm dev:ssl
   ```

Acesse em: `https://conta.urbis.prefeitura.sp.gov.br`

### Opção 2: Desenvolvimento Padrão (Sem Proxy SSL)

```bash
pnpm --filter @open-urbis/map-accounts dev
```

Acesse em: `http://localhost:4200`

---

## 🏗️ Build de Produção

```bash
pnpm --filter @open-urbis/map-accounts build:prod
```

Os arquivos de distribuição serão gerados em `dist/accounts/browser`.

---

## 🧪 Testes

```bash
pnpm --filter @open-urbis/map-accounts test
```
